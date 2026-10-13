import Stripe from "stripe";
import {
  AccessError,
  plans,
  type PaidPlan,
  type BillingInterval,
} from "./catalog";
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new AccessError(
      "BILLING_UNAVAILABLE",
      "Billing is not configured yet.",
      503,
    );
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
}
export function priceId(plan: PaidPlan, interval: BillingInterval) {
  const id =
    process.env[`STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`];
  if (!id?.startsWith("price_"))
    throw new AccessError(
      "BILLING_UNAVAILABLE",
      "This billing option is not configured yet.",
      503,
    );
  return id;
}
export function planForPrice(id: string) {
  for (const plan of ["starter", "pro"] as const)
    for (const interval of ["monthly", "yearly"] as const)
      if (
        id ===
        process.env[
          `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`
        ]
      )
        return { plan, interval };
  throw new Error("Unapproved Stripe price");
}
export async function verifyPrices(stripe: Stripe) {
  const products = new Map<string, string>();
  for (const plan of ["starter", "pro"] as const)
    for (const interval of ["monthly", "yearly"] as const) {
      const price = await stripe.prices.retrieve(priceId(plan, interval));
      if (
        !price.active ||
        price.currency !== "usd" ||
        price.unit_amount !== plans[plan][interval] ||
        price.recurring?.interval !==
          (interval === "monthly" ? "month" : "year") ||
        price.recurring.interval_count !== 1 ||
        price.recurring.usage_type !== "licensed"
      )
        throw new Error(`Stripe price does not match ${plan}/${interval}`);
      const product =
        typeof price.product === "string" ? price.product : price.product.id;
      if (products.has(plan) && products.get(plan) !== product)
        throw new Error("Intervals must share the same product");
      products.set(plan, product);
    }
  if (products.get("starter") === products.get("pro"))
    throw new Error("Starter and Pro must be separate products");
}
export const objectId = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;
