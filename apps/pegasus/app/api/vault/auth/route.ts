import { cookies } from "next/headers";
import { z } from "zod";
import { challengeCookie, cookieOptions, digest, requestCode, sessionCookie, verifyCode } from "../../../../lib/vault/auth";
import { database } from "../../../../lib/vault/db";
import { checkOrigin, failure, json, readBody } from "../../../../lib/vault/http";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = z.discriminatedUnion("intent", [z.object({ intent: z.literal("request") }), z.object({ intent: z.literal("verify"), code: z.string().regex(/^\d{6}$/) })]).parse(await readBody(request, 1000));
    const jar = await cookies();
    if (body.intent === "request") {
      jar.set(challengeCookie, await requestCode(), { ...cookieOptions, maxAge: 600 });
      return json({ sent: true });
    }
    const token = await verifyCode(jar.get(challengeCookie)?.value ?? "", body.code);
    jar.set(sessionCookie, token, { ...cookieOptions, maxAge: 14 * 86400 });
    jar.delete(challengeCookie);
    return json({ authenticated: true });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const jar = await cookies();
    const token = jar.get(sessionCookie)?.value;
    if (token) await database().query("delete from pegasus_vault.sessions where token_hash=$1", [digest(token)]);
    jar.delete(sessionCookie);
    jar.delete(challengeCookie);
    return json({ authenticated: false });
  } catch (error) { return failure(error); }
}
