import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString:
      process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
  });
  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    await connection.query("SELECT pg_advisory_xact_lock(62109)");
    for (const name of [
      "0004_site_analysis.sql",
      "0005_competitor_analysis.sql",
      "0006_brands.sql",
      "0007_discovery_messages.sql",
      "0008_studio_projects.sql",
      "0009_waitlist.sql",
      "0013_waitlist_survey.sql",
    ]) {
      await connection.query(await readFile(`drizzle/${name}`, "utf8"));
    }
    await connection.query("COMMIT");
    console.log("Application schema is ready.");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
