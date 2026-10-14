import type Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { pool } from "../auth/auth";
import { lockAccount, transaction } from "../usage/ledger";
import { AccessError, type PaidPlan, type BillingInterval } from "./catalog";
import { priceId, stripeClient, verifyPrices, planForPrice } from "./stripe";

// Session advisory lock serializes Stripe mutations without holding a SQL transaction open.
export async function customerLock<T>(userId: string, work: () => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtextextended($1,62110))", [
      userId,
    ]);
    return await work();
  } finally {
    await client.query(
      "SELECT pg_advisory_unlock(hashtextextended($1,62110))",
      [userId],
    );
    client.release();
  }
}
export function returnUrl(path: string, status?: string) {
  const origin = process.env.WEB_APP_URL ?? "http://localhost:3010";
  const target = new URL(path, origin);
  if (
    target.origin !== new URL(origin).origin ||
    !target.pathname.startsWith("/workspace")
  )
    throw new AccessError(
      "INVALID_RETURN_URL",
      "Invalid return destination",
      400,
    );
  if (status) target.searchParams.set("billing", status);
  return target.toString();
}
async function accountFor(userId: string) {
  return transaction(
    async (client) => (await lockAccount(client, userId)).account,
  );
}
export async function checkout(
  userId: string,
  plan: PaidPlan,
  interval: BillingInterval,
  path: string,
  stripe: Stripe = stripeClient(),
) {
  return customerLock(userId, async () => {
    await verifyPrices(stripe);
    const account = await accountFor(userId);
    let customer = account.customer_id;
    if (!customer) {
      const {
        rows: [user],
      } = await pool.query('SELECT email FROM "user" WHERE id=$1', [userId]);
      const created = await stripe.customers.create(
        { email: user.email, metadata: { narrativee_user_id: userId } },
        { idempotencyKey: `customer:${userId}` },
      );
      customer = created.id;
      await pool.query(
        "UPDATE billing_account SET customer_id=$2 WHERE user_id=$1",
        [userId, customer],
      );
    }
    // Stripe is checked as well: a checkout webhook may still be in flight.
    const subscriptions = await stripe.subscriptions.list({
      customer,
      status: "all",
      limit: 100,
    });
    const incomplete = subscriptions.data.find(
      (s) => s.status === "incomplete",
    );
    if (incomplete?.latest_invoice) {
      const invoice =
        typeof incomplete.latest_invoice === "string"
          ? await stripe.invoices.retrieve(incomplete.latest_invoice)
          : incomplete.latest_invoice;
      if (invoice?.hosted_invoice_url)
        return { url: invoice.hosted_invoice_url };
    }
    if (
      subscriptions.data.some(
        (s) => !["canceled", "incomplete_expired"].includes(s.status),
      )
    )
      throw new AccessError(
        "SUBSCRIPTION_EXISTS",
        "Manage your existing subscription instead.",
        409,
      );
    if (account.checkout_id) {
      const session = await stripe.checkout.sessions.retrieve(
        account.checkout_id,
      );
      if (session.status === "open") {
        if (
          account.checkout_plan === plan &&
          account.checkout_interval === interval &&
          session.amount_total === 0
        )
          return { url: session.url };
        await stripe.checkout.sessions.expire(session.id);
      }
      if (session.status === "complete")
        throw new AccessError(
          "PAYMENT_CONFIRMING",
          "Your payment is being confirmed. Refresh billing shortly.",
          409,
        );
    }
    // Persist key BEFORE the external request; retry the same parameters after an interrupted response.
    const expiredPending =
      account.checkout_expires_at && account.checkout_expires_at <= new Date();
    const key =
      account.checkout_key && !account.checkout_id && !expiredPending
        ? account.checkout_key
        : randomUUID();
    if (
      account.checkout_key &&
      !account.checkout_id &&
      !expiredPending &&
      (account.checkout_plan !== plan || account.checkout_interval !== interval)
    )
      throw new AccessError(
        "CHECKOUT_IN_PROGRESS",
        "Retry your previous checkout selection before changing plans.",
        409,
      );
    const resumed =
      account.checkout_key && !account.checkout_id && !expiredPending;
    const expiresAt =
      resumed && account.checkout_expires_at
        ? Math.floor(+account.checkout_expires_at / 1000)
        : Math.floor(Date.now() / 1000) + 1800;
    const checkoutPath =
      resumed && account.checkout_return_path
        ? account.checkout_return_path
        : path;
    await pool.query(
      `UPDATE billing_account SET checkout_key=$2,checkout_id=NULL,checkout_plan=$3,checkout_interval=$4,checkout_expires_at=to_timestamp($5),checkout_return_path=$6 WHERE user_id=$1`,
      [userId, key, plan, interval, expiresAt, checkoutPath],
    );
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer,
        client_reference_id: userId,
        line_items: [{ price: priceId(plan, interval), quantity: 1 }],
        allowed_payment_method_types: ["card"],
        subscription_data: {
          trial_period_days: 7,
          metadata: { narrativee_user_id: userId },
        },
        success_url: returnUrl(checkoutPath, "confirming"),
        cancel_url: returnUrl(checkoutPath, "cancelled"),
        expires_at: expiresAt,
      },
      { idempotencyKey: `checkout:${userId}:${key}` },
    );
    await pool.query(
      `UPDATE billing_account SET checkout_id=$2,checkout_url=$3,checkout_expires_at=to_timestamp($4) WHERE user_id=$1`,
      [userId, session.id, session.url, session.expires_at],
    );
    return { url: session.url };
  });
}
export async function upgrade(userId: string, path: string) {
  return customerLock(userId, async () => {
    const stripe = stripeClient(),
      account = await accountFor(userId);
    if (!account.subscription_id || account.plan !== "starter")
      throw new AccessError(
        "UPGRADE_UNAVAILABLE",
        "Only Starter can upgrade to Pro.",
        409,
      );
    await verifyPrices(stripe);
    const subscription = await stripe.subscriptions.retrieve(
      account.subscription_id,
    );
    if (subscription.status !== "active" || subscription.cancel_at_period_end)
      throw new AccessError(
        "PAYMENT_REQUIRED",
        "Update your billing or resume your subscription before upgrading.",
      );
    const item = subscription.items.data[0];
    if (planForPrice(item.price.id).plan === "pro")
      return { url: returnUrl(path, "confirming") };
    if (subscription.pending_update) {
      const invoice =
        typeof subscription.latest_invoice === "string"
          ? await stripe.invoices.retrieve(subscription.latest_invoice)
          : subscription.latest_invoice;
      return {
        url: invoice?.hosted_invoice_url ?? returnUrl(path, "confirming"),
      };
    }
    const key = account.upgrade_key ?? randomUUID();
    await pool.query(
      "UPDATE billing_account SET upgrade_key=$2 WHERE user_id=$1",
      [userId, key],
    );
    const updated = await stripe.subscriptions.update(
      subscription.id,
      {
        items: [{ id: item.id, price: priceId("pro", account.interval) }],
        proration_behavior: "always_invoice",
        payment_behavior: "pending_if_incomplete",
        expand: ["latest_invoice"],
      },
      { idempotencyKey: `upgrade:${userId}:${key}` },
    );
    const invoice =
      typeof updated.latest_invoice === "string"
        ? await stripe.invoices.retrieve(updated.latest_invoice)
        : updated.latest_invoice;
    return {
      url:
        invoice?.status === "paid"
          ? returnUrl(path, "confirming")
          : (invoice?.hosted_invoice_url ?? returnUrl(path, "confirming")),
    };
  });
}
export async function portal(userId: string, path: string) {
  const stripe = stripeClient(),
    account = await accountFor(userId);
  if (!account.customer_id)
    throw new AccessError(
      "NO_BILLING_ACCOUNT",
      "No paid billing account exists yet.",
      409,
    );
  const configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
  if (!configuration)
    throw new AccessError(
      "BILLING_UNAVAILABLE",
      "The billing portal is not configured.",
      503,
    );
  const config =
    await stripe.billingPortal.configurations.retrieve(configuration);
  if (
    !config.active ||
    config.features.subscription_update?.enabled ||
    !config.features.subscription_cancel.enabled ||
    config.features.subscription_cancel.mode !== "at_period_end"
  )
    throw new Error(
      "Portal configuration must allow term-end cancellation and forbid subscription updates",
    );
  const session = await stripe.billingPortal.sessions.create({
    customer: account.customer_id,
    configuration,
    return_url: returnUrl(path),
  });
  return { url: session.url };
}
