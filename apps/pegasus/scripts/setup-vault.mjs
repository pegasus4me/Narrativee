import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const root = fileURLToPath(new URL("../", import.meta.url));
process.loadEnvFile(`${root}../backend/.env`);
const adminUrl = new URL(process.env.DATABASE_URL);
const ca = await readFile(`${root}../backend/certs/supabase-ca.crt`, "utf8");
adminUrl.searchParams.delete("sslrootcert");
adminUrl.searchParams.delete("sslmode");
const admin = new Pool({ connectionString: adminUrl.toString(), ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis: 10000 });
try {
  const role = await admin.query("select 1 from pg_roles where rolname='pegasus_vault_app'");
  if (role.rowCount) throw new Error("Vault role already exists; use the existing environment rather than rotating it.");
  const password = randomBytes(32).toString("hex");
  await admin.query(`create role pegasus_vault_app login password '${password}' nosuperuser nocreatedb nocreaterole noinherit`);
  await admin.query(await readFile(`${root}migrations/001_vault.sql`, "utf8"));
  const appUrl = new URL(adminUrl);
  appUrl.username = "pegasus_vault_app";
  appUrl.password = password;
  const env = {
    VAULT_DATABASE_URL: appUrl.toString(), VAULT_DATABASE_CA: ca,
    VAULT_SECRET: randomBytes(32).toString("hex"),
    VAULT_EMAIL_FROM: "safoan.inc <vault@weppo.co>",
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-5.6-luna",
  };
  await writeFile(`${root}.env.local`, Object.entries(env).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n") + "\n", { mode: 0o600, flag: "wx" });
  const app = new Pool({ connectionString: appUrl.toString(), ssl: { ca, rejectUnauthorized: true } });
  try {
    await app.query("select count(*) from pegasus_vault.projects");
    const permissions = await app.query("select has_table_privilege(current_user, 'public.user', 'select') as narrativee_access");
    if (permissions.rows[0]?.narrativee_access) throw new Error("Runtime role unexpectedly has Narrativee access.");
    console.log("Vault schema ready. Dedicated runtime role verified; secrets saved locally without printing.");
  } finally { await app.end(); }
} finally { await admin.end(); }
