import "dotenv/config";
import { pool } from "../src/auth/auth";
async function main() {
  const {
    rows: [metrics],
  } = await pool.query(`SELECT
    (SELECT coalesce(sum(cost),0)::text FROM provider_call) AS provider_spend_microdollars,
    (SELECT coalesce(sum(cost-absorbed),0)::text FROM provider_call WHERE status='charged') AS deducted_microdollars,
    (SELECT coalesce(sum(absorbed),0)::text FROM provider_call) AS absorbed_microdollars,
    (SELECT count(*)::int FROM provider_call WHERE cost IS NULL AND status IN ('charged','refunded')) AS unknown_usage_calls,
    (SELECT count(*)::int FROM billable_operation WHERE status='running' AND heartbeat_at<now()-interval '10 minutes') AS stale_operations,
    (SELECT coalesce(sum(reserved),0)::text FROM credit_bucket) AS reserved_microdollars,
    (SELECT count(*)::int FROM stripe_event WHERE processed_at IS NULL) AS pending_webhooks,
    (SELECT count(*)::int FROM stripe_event WHERE processed_at IS NULL AND error IS NOT NULL) AS failed_webhooks`);
  console.log(JSON.stringify({ at: new Date().toISOString(), ...metrics }));
}
void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
