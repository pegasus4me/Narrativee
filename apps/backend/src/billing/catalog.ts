export const CREDIT_MICRODOLLARS = 10_000;
export const plans = {
  trial: { name: "Free trial", credits: 400, days: 7, monthly: 0, yearly: 0 },
  starter: { name: "Starter", credits: 2000, monthly: 1900, yearly: 18240 },
  pro: { name: "Pro", credits: 7000, monthly: 4900, yearly: 47040 },
  agency: { name: "Agency", credits: null, monthly: null, yearly: null },
} as const;
export type PaidPlan = "starter" | "pro";
export type BillingInterval = "monthly" | "yearly";
export function monthlyPeriod(anchor: Date, now: Date) {
  const at = (offset: number) => {
    const date = new Date(anchor);
    date.setUTCDate(1);
    date.setUTCMonth(anchor.getUTCMonth() + offset);
    const end = new Date(date);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    date.setUTCDate(Math.min(anchor.getUTCDate(), end.getUTCDate()));
    return date;
  };
  let offset =
    (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    now.getUTCMonth() -
    anchor.getUTCMonth();
  if (at(offset) > now) offset--;
  return { start: at(offset), end: at(offset + 1) };
}
export class AccessError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 402,
  ) {
    super(message);
  }
}
export function asAccessError(error: unknown): AccessError | undefined {
  for (let depth = 0; depth < 5; depth++) {
    if (error instanceof AccessError) return error;
    if (!error || typeof error !== "object" || !("cause" in error))
      return undefined;
    error = error.cause;
  }
  return undefined;
}
export function billingError(error: unknown) {
  const access = asAccessError(error);
  return access ? { code: access.code, error: access.message } : {};
}
