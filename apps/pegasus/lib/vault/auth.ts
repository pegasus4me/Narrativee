import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { database, transaction } from "./db";
import { ownerEmail } from "./model";
import { VaultError } from "./http";

export const sessionCookie = "pegasus_vault_session";
export const challengeCookie = "pegasus_vault_challenge";
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/" };

export function digest(value: string) {
  if (!process.env.VAULT_SECRET || process.env.VAULT_SECRET.length < 32) throw new VaultError("Accès du vault non configuré.", 503);
  return createHmac("sha256", process.env.VAULT_SECRET).update(value).digest("hex");
}

export function validDigest(value: string, stored: string) {
  const actual = Buffer.from(digest(value), "hex");
  const expected = Buffer.from(stored, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export async function hasSession() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const result = await database().query("select 1 from pegasus_vault.sessions where token_hash=$1 and owner_email=$2 and expires_at>now()", [digest(token), ownerEmail]);
  return result.rowCount === 1;
}

export async function requireSession() {
  if (!(await hasSession())) throw new VaultError("Connectez-vous pour accéder au vault.", 401);
}

export async function requestCode() {
  if (!process.env.RESEND_API_KEY || !process.env.VAULT_EMAIL_FROM) throw new VaultError("Envoi des codes non configuré.", 503);
  const challenge = randomBytes(32).toString("hex");
  const code = randomInt(100000, 1000000).toString();
  await transaction(async client => {
    await client.query("select pg_advisory_xact_lock(71319842)");
    const count = await client.query<{ count: string; recent: boolean }>("select count(*)::text, coalesce(bool_or(created_at>now()-interval '60 seconds'),false) as recent from pegasus_vault.challenges where owner_email=$1 and created_at>now()-interval '1 hour'", [ownerEmail]);
    if (count.rows[0]?.recent || Number(count.rows[0]?.count) >= 5) throw new VaultError("Patientez avant de demander un nouveau code (cinq par heure maximum).", 429);
    await client.query("delete from pegasus_vault.challenges where created_at<now()-interval '1 day'");
    await client.query("insert into pegasus_vault.challenges(id,owner_email,code_hash) values($1,$2,$3)", [digest(challenge), ownerEmail, digest(`${challenge}:${code}`)]);
  });
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.VAULT_EMAIL_FROM, to: [ownerEmail], subject: "Votre code d'accès à safoan.inc", text: `Votre code pour le vault : ${code}\n\nIl expire dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez cet email.` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Mail unavailable");
  } catch { throw new VaultError("Le code n'a pas pu être envoyé. Réessayez dans une minute.", 503); }
  return challenge;
}

export async function verifyCode(challenge: string, code: string) {
  if (!/^[a-f0-9]{64}$/.test(challenge) || !/^\d{6}$/.test(code)) throw new VaultError("Code invalide ou expiré.");
  const token = randomBytes(32).toString("hex");
  const verified = await transaction(async client => {
    const result = await client.query<{ code_hash: string; attempts: number }>("select code_hash,attempts from pegasus_vault.challenges where id=$1 and owner_email=$2 and expires_at>now() for update", [digest(challenge), ownerEmail]);
    const row = result.rows[0];
    if (!row || row.attempts >= 5) return false;
    if (!validDigest(`${challenge}:${code}`, row.code_hash)) {
      await client.query("update pegasus_vault.challenges set attempts=attempts+1 where id=$1", [digest(challenge)]);
      return false;
    }
    await client.query("delete from pegasus_vault.challenges where id=$1", [digest(challenge)]);
    await client.query("delete from pegasus_vault.sessions where expires_at<now()");
    await client.query("insert into pegasus_vault.sessions(token_hash,owner_email) values($1,$2)", [digest(token), ownerEmail]);
    return true;
  });
  if (!verified) throw new VaultError("Code invalide ou expiré.");
  return token;
}
