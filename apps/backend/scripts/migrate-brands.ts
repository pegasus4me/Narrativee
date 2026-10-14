import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function main() {
  const databaseUrl =
    process.env.NODE_ENV === "production" || process.env.RENDER === "true"
      ? process.env.DATABASE_URL
      : process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be configured before running migrations.",
    );
  }
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    await connection.query("SET LOCAL lock_timeout = '10s'");
    await connection.query("SET LOCAL statement_timeout = '60s'");
    await connection.query("SELECT pg_advisory_xact_lock(62109)");
    const {
      rows: [base],
    } = await connection.query("SELECT to_regclass('public.user') AS existing");
    if (!base.existing) {
      for (const name of [
        "0000_windy_toxin.sql",
        "0001_outstanding_vermin.sql",
        "0002_voice_memory.sql",
        "0003_creation_sessions.sql",
      ]) {
        await connection.query(await readFile(`drizzle/${name}`, "utf8"));
      }
    }
    for (const name of [
      "0004_site_analysis.sql",
      "0005_competitor_analysis.sql",
      "0006_brands.sql",
      "0007_discovery_messages.sql",
      "0008_studio_projects.sql",
      "0009_waitlist.sql",
      "0010_brand_brain.sql",
      "0011_brand_brain_discovery.sql",
      "0012_studio_canvas.sql",
      "0013_waitlist_survey.sql",
      "0014_studio_message_agent.sql",
      "0015_studio_agent_threads.sql",
      "0016_studio_agent_settings.sql",
      "0017_studio_media_models.sql",
      "0018_studio_approvals.sql",
      "0019_trial_credits.sql",
      "0020_studio_project_title.sql",
      "0021_billing.sql",
      "0022_server_only_tables.sql",
      "0023_brand_products.sql",
      "0024_trial_allowance.sql",
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
