import type Stripe from "stripe";
import type { PoolClient } from "pg";
import { pool } from "../auth/auth";
import { transaction, lockAccount, snapshot } from "../usage/ledger";
import { plans, CREDIT_MICRODOLLARS } from "./catalog";
import { stripeClient, objectId, planForPrice } from "./stripe";
import { customerLock } from "./checkout";

export async function processStripeEvent(
  event: Stripe.Event,
  stripe = stripeClient(),
) {
  await pool.query(
    `INSERT INTO stripe_event(id,type,payload) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
    [event.id, event.type, JSON.stringify(event)],
  );
  const {
    rows: [stored],
  } = await pool.query("SELECT processed_at FROM stripe_event WHERE id=$1", [
    event.id,
  ]);
  if (stored.processed_at) return;
  try {
    const object = event.data.object;
    let customer =
      "customer" in object
        ? objectId(object.customer as string | { id: string } | null)
        : undefined;
    let risk: { invoiceId: string; revoked: boolean }[] = [];
    if (
      event.type === "charge.refunded" ||
      event.type.startsWith("charge.dispute.")
    ) {
      const dispute = event.type.startsWith("charge.dispute.")
        ? (object as Stripe.Dispute)
        : null;
      const charge = dispute
        ? await stripe.charges.retrieve(objectId(dispute.charge)!)
        : await stripe.charges.retrieve((object as Stripe.Charge).id);
      customer = objectId(charge.customer);
      const intent = objectId(charge.payment_intent);
      if (intent) {
        const currentDispute = dispute
          ? await stripe.disputes.retrieve(dispute.id)
          : null;
        const revoked =
          charge.amount_refunded > 0 ||
          (currentDispute ? currentDispute.status !== "won" : charge.disputed);
        for await (const payment of stripe.invoicePayments.list({
          payment: { type: "payment_intent", payment_intent: intent },
          status: "paid",
          limit: 100,
        })) {
          risk.push({ invoiceId: objectId(payment.invoice)!, revoked });
        }
      }
    }
    if (!customer) {
      await pool.query(
        "UPDATE stripe_event SET processed_at=now() WHERE id=$1",
        [event.id],
      );
      return;
    }
    const {
      rows: [account],
    } = await pool.query(
      "SELECT user_id FROM billing_account WHERE customer_id=$1",
      [customer],
    );
    // Our checkout persists customer mapping before creating a session. Unrelated Stripe customers are ignored.
    if (!account) {
      await pool.query(
        "UPDATE stripe_event SET processed_at=now() WHERE id=$1",
        [event.id],
      );
      return;
    }
    await customerLock(account.user_id, async (client) => {
      const {
        rows: [duplicate],
      } = await client.query(
        "SELECT processed_at FROM stripe_event WHERE id=$1",
        [event.id],
      );
      if (duplicate.processed_at) return;
      await syncSubscriptionForCustomer(
        account.user_id,
        customer,
        stripe,
        risk,
        client,
      );
      await client.query(
        `UPDATE stripe_event SET processed_at=now(),error=NULL,attempts=attempts+1 WHERE id=$1`,
        [event.id],
      );
    });
  } catch (error) {
    await pool.query(
      "UPDATE stripe_event SET error=$2,attempts=attempts+1 WHERE id=$1",
      [event.id, error instanceof Error ? error.message : "Webhook failed"],
    );
    throw error;
  }
}

export async function syncSubscriptionForCustomer(
  userId: string,
  customer: string,
  stripe: Stripe = stripeClient(),
  risk: { invoiceId: string; revoked: boolean }[] = [],
  existingClient?: PoolClient,
) {
  const subscriptions = await stripe.subscriptions.list({
    customer,
    status: "all",
    limit: 100,
  });
  const candidates = subscriptions.data
    .filter((s) => !["incomplete_expired"].includes(s.status))
    .sort((a, b) => b.created - a.created);
  const active = candidates.filter((s) => s.status !== "canceled");
  if (active.length > 1)
    throw new Error("Multiple subscriptions require billing reconciliation");
  const subscription = active[0] ?? candidates[0];
  if (!subscription) {
    return;
  }
  const item = subscription.items.data[0];
  if (subscription.items.data.length !== 1 || item.quantity !== 1)
    throw new Error("Unsupported subscription configuration");
  const selection = planForPrice(item.price.id);
  // Read current Stripe invoices rather than trusting an old webhook payload.
  const paid: Array<{
    id: string;
    start: Date;
    end: Date;
    plan: "starter" | "pro";
  }> = [];
  for await (const invoice of stripe.invoices.list({
    subscription: subscription.id,
    status: "paid",
    limit: 100,
  })) {
    for (const line of invoice.lines.data) {
      const price = line.pricing?.price_details?.price;
      if (!price || line.amount <= 0) continue;
      const approved = planForPrice(objectId(price)!);
      paid.push({
        id: invoice.id,
        start: new Date(line.period.start * 1000),
        end: new Date(line.period.end * 1000),
        plan: approved.plan,
      });
    }
  }

  // Handle active 7-day Stripe trial
  if (
    subscription.status === "trialing" &&
    subscription.trial_end &&
    subscription.trial_end * 1000 > Date.now()
  ) {
    paid.push({
      id: `trial_${subscription.id}`,
      start: new Date(
        (subscription.trial_start ?? subscription.start_date) * 1000,
      ),
      end: new Date(subscription.trial_end * 1000),
      plan: selection.plan,
    });
  }

  await transaction(async (client) => {
    await lockAccount(client, userId);
    for (const invoice of paid) {
      await client.query(
        `INSERT INTO billing_payment(invoice_id,user_id,subscription_id,period_start,period_end,plan)
        VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(invoice_id) DO UPDATE SET
        period_start=least(billing_payment.period_start,excluded.period_start),period_end=greatest(billing_payment.period_end,excluded.period_end),
        plan=CASE WHEN excluded.plan='pro' THEN 'pro' ELSE billing_payment.plan END`,
        [
          invoice.id,
          userId,
          subscription.id,
          invoice.start,
          invoice.end,
          invoice.plan,
        ],
      );
    }
    for (const item of risk) {
      await client.query(
        `UPDATE billing_payment SET revoked=$2 WHERE invoice_id=$1`,
        [item.invoiceId, item.revoked],
      );
      if (item.revoked)
        await client.query(
          `UPDATE credit_bucket b SET revoked=true FROM billing_payment p
        WHERE p.invoice_id=$1 AND b.user_id=p.user_id AND b.kind='paid' AND b.starts_at>=p.period_start AND b.starts_at<p.period_end`,
          [item.invoiceId],
        );
    }
    const {
      rows: [coverage],
    } = await client.query(
      `SELECT max(period_end) AS paid_until FROM billing_payment
      WHERE user_id=$1 AND subscription_id=$2 AND plan=$3 AND NOT revoked`,
      [userId, subscription.id, selection.plan],
    );
    let paidUntil = coverage.paid_until as Date | null;
    if (subscription.ended_at && paidUntil)
      paidUntil = new Date(Math.min(+paidUntil, subscription.ended_at * 1000));
    const {
      rows: [prior],
    } = await client.query(
      `SELECT plan,subscription_id,anchor FROM billing_account WHERE user_id=$1`,
      [userId],
    );
    const paidUpgrade =
      prior.subscription_id === subscription.id &&
      prior.plan === "starter" &&
      selection.plan === "pro" &&
      paidUntil &&
      paidUntil > new Date();
    await client.query(
      `UPDATE billing_account SET subscription_id=$2,plan=$3,status=$4,interval=$5,
      anchor=$6,paid_until=$7,cancel_at_period_end=$8,checkout_key=NULL,checkout_id=NULL,checkout_url=NULL,
      upgrade_key=CASE WHEN $3='pro' THEN NULL ELSE upgrade_key END,updated_at=now() WHERE user_id=$1`,
      [
        userId,
        subscription.id,
        !paidUntil && prior.plan === "trial" ? "trial" : selection.plan,
        subscription.status,
        selection.interval,
        prior.subscription_id === subscription.id && prior.anchor
          ? prior.anchor
          : new Date(subscription.start_date * 1000),
        paidUntil,
        subscription.cancel_at_period_end,
      ],
    );
    if (paidUpgrade)
      await client.query(
        `UPDATE credit_bucket SET allowance=$2 WHERE user_id=$1 AND kind='paid' AND starts_at<=now() AND expires_at>now() AND NOT revoked`,
        [userId, plans.pro.credits * CREDIT_MICRODOLLARS],
      );
    // Resolve a won dispute only for its original covered periods; no new free bucket.
    for (const item of risk.filter((r) => !r.revoked))
      await client.query(
        `UPDATE credit_bucket b SET revoked=false FROM billing_payment p
      WHERE p.invoice_id=$1 AND b.user_id=p.user_id AND b.kind='paid' AND b.starts_at>=p.period_start AND b.starts_at<p.period_end
      AND NOT EXISTS(SELECT 1 FROM billing_payment other WHERE other.user_id=b.user_id AND other.revoked AND b.starts_at>=other.period_start AND b.starts_at<other.period_end)`,
        [item.invoiceId],
      );
    await snapshot(client, userId);
  }, existingClient);
}

export async function retryStripeEvents() {
  const { rows } = await pool.query(
    `SELECT payload FROM stripe_event WHERE processed_at IS NULL AND received_at<now()-interval '1 minute' ORDER BY received_at LIMIT 20`,
  );
  for (const row of rows)
    try {
      await processStripeEvent(row.payload);
    } catch (error) {
      console.error("Stripe event retry failed", error);
    }
}
