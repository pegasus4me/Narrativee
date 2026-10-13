import { rateFor } from "../usage/model-rates";
import { stripeClient, verifyPrices } from "./stripe";
export async function verifyBillingConfiguration() {
  for (const name of [
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PORTAL_CONFIGURATION_ID",
    "WEB_APP_URL",
    "BILLING_TEST_VERIFIED_AT",
    "AI_COST_CHECKS_VERIFIED_AT",
  ])
    if (!process.env[name]) throw new Error(`Billing launch requires ${name}`);
  for (const name of ["BILLING_TEST_VERIFIED_AT", "AI_COST_CHECKS_VERIFIED_AT"])
    if (!Number.isFinite(Date.parse(process.env[name]!)))
      throw new Error(`Invalid verification date: ${name}`);
  for (const model of new Set([
    process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
    process.env.BRAND_IDENTITY_MODEL ??
      process.env.OPENAI_MODEL ??
      "gpt-5.6-luna",
    process.env.BRAND_BOARD_TEXT_MODEL ??
      process.env.OPENAI_MODEL ??
      "gpt-5.6-luna",
  ]))
    rateFor(model, "text");
  rateFor(process.env.BRAND_BOARD_IMAGE_MODEL ?? "gpt-image-2", "image");
  const tools = JSON.parse(process.env.AI_TOOL_RATES_JSON ?? "{}");
  for (const tool of ["firecrawl:scrapeHomepage", "firecrawl:searchWeb"])
    if (!tools[tool]) throw new Error(`Missing verified tool rate: ${tool}`);
  const stripe = stripeClient();
  await verifyPrices(stripe);
  const config = await stripe.billingPortal.configurations.retrieve(
    process.env.STRIPE_PORTAL_CONFIGURATION_ID!,
  );
  if (
    !config.active ||
    config.features.subscription_update?.enabled ||
    !config.features.subscription_cancel.enabled ||
    config.features.subscription_cancel.mode !== "at_period_end" ||
    !config.features.invoice_history.enabled ||
    !config.features.payment_method_update.enabled
  )
    throw new Error("Billing portal is not configured for the v1 policy");
}
