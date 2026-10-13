import { transaction } from "../usage/ledger";
export async function grantLegacyTrials() {
  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(62111)");
    const result = await client.query(
      `UPDATE "user" SET trial_credits_remaining=80,trial_ends_at=now()+interval '168 hours' WHERE trial_ends_at IS NULL RETURNING id`,
    );
    await client.query(
      `INSERT INTO billing_account(user_id) SELECT id FROM "user" ON CONFLICT DO NOTHING`,
    );
    await client.query(`INSERT INTO credit_bucket(id,user_id,kind,starts_at,expires_at,allowance,spent)
      SELECT 'trial:'||id,id,'trial',trial_ends_at-interval '168 hours',trial_ends_at,800000,
      greatest(0,80-trial_credits_remaining)::bigint*10000 FROM "user" WHERE trial_ends_at IS NOT NULL ON CONFLICT DO NOTHING`);
    return result.rowCount;
  });
}
