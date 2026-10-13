import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { stripeClient } from "../src/billing/stripe";
import { plans } from "../src/billing/catalog";
async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))
    throw new Error(
      "Set a Stripe TEST secret key before running test setup. Live credentials are refused.",
    );
  const stripe = stripeClient();
  const settings: Record<string, string> = {};
  for (const plan of ["starter", "pro"] as const) {
    const product = await stripe.products.create(
      {
        name: `Narrativee ${plans[plan].name}`,
        metadata: { narrativee_plan: plan },
      },
      { idempotencyKey: `narrativee-v1-product-${plan}` },
    );
    for (const interval of ["monthly", "yearly"] as const) {
      const price = await stripe.prices.create(
        {
          product: product.id,
          currency: "usd",
          unit_amount: plans[plan][interval],
          recurring: { interval: interval === "monthly" ? "month" : "year" },
          metadata: { narrativee_plan: plan, narrativee_interval: interval },
        },
        { idempotencyKey: `narrativee-v1-price-${plan}-${interval}` },
      );
      settings[`STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`] =
        price.id;
    }
  }
  const configurations = await stripe.billingPortal.configurations.list({
    limit: 100,
  });
  const existing = configurations.data.find(
    (c) => c.metadata?.narrativee_policy === "v1",
  );
  const portal =
    existing ??
    (await stripe.billingPortal.configurations.create({
      metadata: { narrativee_policy: "v1" },
      business_profile: { headline: "Manage your Narrativee subscription" },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
        subscription_update: { enabled: false },
      },
    }));
  settings.STRIPE_PORTAL_CONFIGURATION_ID = portal.id;
  await writeFile(
    ".env.billing.test",
    Object.entries(settings)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n") + "\n",
    { mode: 0o600 },
  );
  console.log(
    "Test products, four prices and portal are ready. Configuration saved to .env.billing.test (no secret key).",
  );
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Test setup failed");
  process.exitCode = 1;
});
