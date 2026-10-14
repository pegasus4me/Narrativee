import { Pool, type PoolClient } from "pg";
import { dataSchema, ownerEmail, type Project, type ProjectData } from "./model";
import { VaultError } from "./http";

let pool: Pool | undefined;
export function database() {
  if (!process.env.VAULT_DATABASE_URL) throw new VaultError("Stockage du vault non configuré.", 503);
  if (!pool) {
    const url = new URL(process.env.VAULT_DATABASE_URL);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslrootcert");
    pool = new Pool({ connectionString: url.toString(), max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000, ssl: { rejectUnauthorized: true, ...(process.env.VAULT_DATABASE_CA ? { ca: process.env.VAULT_DATABASE_CA.replace(/\\n/g, "\n") } : {}) } });
    pool.on("error", () => console.error("Vault database connection lost"));
  }
  return pool;
}

export async function transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await database().connect();
  try {
    await client.query("begin");
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally { client.release(); }
}

export async function getProject(id: string): Promise<Project> {
  const result = await database().query<Project>("select id, revision, data from pegasus_vault.projects where id=$1 and owner_email=$2", [id, ownerEmail]);
  if (!result.rows[0]) throw new VaultError("Projet introuvable.", 404);
  return result.rows[0];
}

export async function saveProject(id: string, revision: number, value: ProjectData): Promise<Project> {
  const data = dataSchema.parse(value);
  const result = await database().query<Project>("update pegasus_vault.projects set data=$1, revision=revision+1, updated_at=now() where id=$2 and owner_email=$3 and revision=$4 returning id, revision, data", [JSON.stringify(data), id, ownerEmail, revision]);
  if (!result.rows[0]) throw new VaultError("Ce projet a changé sur un autre écran. Rechargez avant de réessayer ; votre saisie est conservée.", 409);
  return result.rows[0];
}
