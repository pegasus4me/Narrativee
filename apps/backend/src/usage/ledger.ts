import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../auth/auth";
import {
  AccessError,
  CREDIT_MICRODOLLARS,
  monthlyPeriod,
  plans,
} from "../billing/catalog";

export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '10s'");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function lockAccount(client: PoolClient, userId: string) {
  await client.query(
    `INSERT INTO billing_account(user_id) VALUES($1) ON CONFLICT DO NOTHING`,
    [userId],
  );
  const {
    rows: [account],
  } = await client.query(
    `SELECT * FROM billing_account WHERE user_id=$1 FOR UPDATE`,
    [userId],
  );
  // Preserve legacy 80-credit grants; signup defaults supply the allowance for new trials.
  await client.query(
    `INSERT INTO credit_bucket(id,user_id,kind,starts_at,expires_at,allowance,spent)
    SELECT 'trial:'||id,id,'trial',trial_ends_at-interval '168 hours',trial_ends_at,greatest(80,trial_credits_remaining)::bigint*10000,
    greatest(0,80-trial_credits_remaining)::bigint*10000 FROM "user"
    WHERE id=$1 AND trial_ends_at IS NOT NULL ON CONFLICT DO NOTHING`,
    [userId],
  );
  const {
    rows: [{ now }],
  } = await client.query("SELECT now() AS now");
  if (
    account.anchor &&
    account.paid_until > now &&
    account.plan !== "trial" &&
    !["revoked", "unpaid", "incomplete", "incomplete_expired"].includes(
      account.status,
    )
  ) {
    const period = monthlyPeriod(account.anchor, now);
    // A successful invoice must cover this month. Annual invoices cover twelve resets.
    const {
      rows: [payment],
    } = await client.query(
      `SELECT invoice_id FROM billing_payment
      WHERE user_id=$1 AND subscription_id=$2 AND NOT revoked AND period_start<=$3 AND period_end>$3 LIMIT 1`,
      [userId, account.subscription_id, period.start],
    );
    if (payment)
      await client.query(
        `INSERT INTO credit_bucket(id,user_id,kind,starts_at,expires_at,allowance)
      VALUES($1,$2,'paid',$3,$4,$5) ON CONFLICT DO NOTHING`,
        [
          `paid:${account.subscription_id}:${period.start.toISOString()}`,
          userId,
          period.start,
          new Date(Math.min(+period.end, +account.paid_until)),
          plans[account.plan as "starter" | "pro"].credits *
            CREDIT_MICRODOLLARS,
        ],
      );
  }
  return { account, now: now as Date };
}

export async function snapshot(client: PoolClient, userId: string) {
  const { account, now } = await lockAccount(client, userId);
  const {
    rows: [trial],
  } = await client.query(`SELECT * FROM credit_bucket WHERE id=$1`, [
    `trial:${userId}`,
  ]);
  const paid = account.plan !== "trial";
  const paidValid =
    !paid ||
    (account.paid_until > now &&
      ["active", "trialing", "past_due", "canceled"].includes(account.status));
  const {
    rows: [bucket],
  } = await client.query(
    `SELECT * FROM credit_bucket
    WHERE user_id=$1 AND kind=$2 AND $3::boolean AND starts_at<=now() AND expires_at>now() AND NOT revoked ORDER BY starts_at DESC LIMIT 1`,
    [userId, paid ? "paid" : "trial", paidValid],
  );
  const available = bucket
    ? Math.max(
        0,
        Number(bucket.allowance) -
          Number(bucket.spent) -
          Number(bucket.reserved),
      )
    : 0;
  const reason =
    bucket && available > 0
      ? null
      : paid
        ? bucket
          ? "PAID_CREDITS_EXHAUSTED"
          : "PAYMENT_REQUIRED"
        : !trial
          ? "PAYMENT_REQUIRED"
          : trial.expires_at <= now
            ? "TRIAL_EXPIRED"
            : "TRIAL_CREDITS_EXHAUSTED";
  return {
    plan: account.plan,
    billingInterval: account.interval,
    accessStatus: reason ? "blocked" : "active",
    reason,
    availableCredits: available / CREDIT_MICRODOLLARS,
    availableMicrodollars: available,
    reservedCredits: Number(bucket?.reserved ?? 0) / CREDIT_MICRODOLLARS,
    trialCreditsRemaining: trial
      ? Math.max(
          0,
          Number(trial.allowance) -
            Number(trial.spent) -
            Number(trial.reserved),
        ) / CREDIT_MICRODOLLARS
      : 0,
    trialEndsAt: trial?.expires_at?.toISOString() ?? null,
    trialStatus: !trial
      ? "no_trial"
      : trial.expires_at <= now
        ? "expired"
        : Number(trial.spent) + Number(trial.reserved) >=
            Number(trial.allowance)
          ? "exhausted"
          : "active",
    resetAt:
      paid && account.anchor && account.paid_until > now
        ? monthlyPeriod(account.anchor, now).end.toISOString()
        : null,
    paidUntil: account.paid_until?.toISOString() ?? null,
    cancelAtPeriodEnd: account.cancel_at_period_end,
    paymentNeedsAttention: [
      "past_due",
      "unpaid",
      "revoked",
      "incomplete",
    ].includes(account.status),
    serverTime: now.toISOString(),
    bucketId: bucket?.id ?? null,
  };
}
export const getUsage = (userId: string) =>
  transaction((client) => snapshot(client, userId));
export function assertAccess(usage: Awaited<ReturnType<typeof getUsage>>) {
  if (usage.reason)
    throw new AccessError(
      usage.reason,
      {
        TRIAL_EXPIRED: "Your 7-day trial has ended.",
        TRIAL_CREDITS_EXHAUSTED:
          "Your trial credits are used or reserved by work in progress.",
        PAID_CREDITS_EXHAUSTED:
          "Your monthly allowance is used or reserved by work in progress.",
        PAYMENT_REQUIRED:
          "A paid subscription is required. Check your billing status.",
      }[usage.reason] ?? "Upgrade to continue.",
    );
}

export async function reserve(
  operationId: string,
  model: string,
  rates: unknown,
  amount: number,
) {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new Error("Invalid reservation");
  return transaction(async (client) => {
    const {
      rows: [operation],
    } = await client.query(
      `SELECT user_id,status FROM billable_operation WHERE id=$1`,
      [operationId],
    );
    if (!operation || operation.status !== "running")
      throw new Error("Operation is no longer running");
    const usage = await snapshot(client, operation.user_id);
    assertAccess(usage);
    if (usage.availableMicrodollars < amount)
      throw new AccessError(
        usage.plan === "trial"
          ? "TRIAL_CREDITS_EXHAUSTED"
          : "PAID_CREDITS_EXHAUSTED",
        "There are not enough available credits for this operation.",
      );
    // Recheck after the account lock: recovery and settlement use the same lock.
    const {
      rows: [running],
    } = await client.query(
      `SELECT status FROM billable_operation WHERE id=$1`,
      [operationId],
    );
    if (running.status !== "running")
      throw new Error("Operation was recovered");
    const id = randomUUID();
    await client.query(
      `UPDATE credit_bucket SET reserved=reserved+$2 WHERE id=$1`,
      [usage.bucketId, amount],
    );
    await client.query(
      `INSERT INTO provider_call(id,operation_id,bucket_id,model,rates,reserved) VALUES($1,$2,$3,$4,$5,$6)`,
      [id, operationId, usage.bucketId, model, JSON.stringify(rates), amount],
    );
    return id;
  });
}
export async function recordCall(id: string, cost: number, usage: unknown) {
  if (!Number.isSafeInteger(cost) || cost < 0)
    throw new Error("Invalid provider cost");
  const previous = await transaction(async (client) => {
    const {
      rows: [owner],
    } = await client.query(
      `SELECT o.user_id FROM provider_call c JOIN billable_operation o ON o.id=c.operation_id WHERE c.id=$1`,
      [id],
    );
    if (!owner) throw new Error("Unknown provider call");
    await lockAccount(client, owner.user_id);
    const {
      rows: [call],
    } = await client.query(
      `SELECT * FROM provider_call WHERE id=$1 FOR UPDATE`,
      [id],
    );
    if (call.cost !== null) {
      if (Number(call.cost) !== cost)
        throw new Error("Provider usage changed after recording");
      return Number(call.reserved);
    }
    if (call.status !== "reserved") {
      // A response arriving after crash recovery is overhead; it cannot debit a new period.
      await client.query(
        `UPDATE provider_call SET cost=$2,usage=$3,absorbed=$2 WHERE id=$1`,
        [id, cost, JSON.stringify(usage)],
      );
      return Math.max(cost, Number(call.reserved));
    }
    const held = Math.min(cost, Number(call.reserved));
    await client.query(
      `UPDATE credit_bucket SET reserved=reserved-$2 WHERE id=$1`,
      [call.bucket_id, Number(call.reserved) - held],
    );
    await client.query(
      `UPDATE provider_call SET cost=$2,usage=$3,status='measured',reserved=$4 WHERE id=$1`,
      [id, cost, JSON.stringify(usage), held],
    );
    return Number(call.reserved);
  });
  if (cost > previous)
    throw new Error(
      "Provider cost exceeded its reservation; operation must be reviewed",
    );
}
export async function finishOperation(
  id: string,
  result: unknown,
  error?: unknown,
) {
  await transaction(async (client) => {
    const {
      rows: [owner],
    } = await client.query(
      `SELECT user_id FROM billable_operation WHERE id=$1`,
      [id],
    );
    if (!owner) return;
    await lockAccount(client, owner.user_id);
    const {
      rows: [operation],
    } = await client.query(
      `SELECT * FROM billable_operation WHERE id=$1 FOR UPDATE`,
      [id],
    );
    if (operation.status !== "running") return;
    const delivered =
      operation.delivered ||
      (!error && result !== null && result !== undefined);
    const { rows: calls } = await client.query(
      `SELECT * FROM provider_call WHERE operation_id=$1 AND status IN ('reserved','measured') FOR UPDATE`,
      [id],
    );
    for (const call of calls) {
      // Unknown usage (e.g. a lost network response) is overhead, never an estimated customer charge.
      const cost = Number(call.cost ?? 0),
        charged = delivered ? Math.min(cost, Number(call.reserved)) : 0;
      await client.query(
        `UPDATE credit_bucket SET reserved=reserved-$2,spent=spent+$3 WHERE id=$1`,
        [call.bucket_id, call.reserved, charged],
      );
      await client.query(
        `UPDATE provider_call SET status=$2,absorbed=$3 WHERE id=$1`,
        [call.id, delivered ? "charged" : "refunded", cost - charged],
      );
    }
    await client.query(
      `UPDATE billable_operation SET status=$2,result=$3,error=$4,finished_at=now() WHERE id=$1`,
      [
        id,
        delivered ? "completed" : "failed",
        JSON.stringify(result ?? null),
        error instanceof Error ? error.message : error ? String(error) : null,
      ],
    );
  });
}
export async function recoverAbandoned() {
  const { rows } = await pool.query(
    `SELECT id FROM billable_operation WHERE status='running' AND heartbeat_at<now()-interval '10 minutes' LIMIT 100`,
  );
  for (const operation of rows)
    await finishOperation(
      operation.id,
      null,
      new Error("Worker stopped before completing this operation"),
    );
}
