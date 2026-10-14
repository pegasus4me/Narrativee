import { API_URL } from "../api-config";
export const USAGE_CHANGED = "narrativee:usage-changed";
export const UPGRADE_REQUIRED = "narrativee:upgrade-required";
export const OPEN_UPGRADE = "narrativee:open-upgrade";
export interface Usage {
  plan: "trial" | "starter" | "pro";
  billingInterval?: "monthly" | "yearly" | null;
  accessStatus: "active" | "blocked";
  reason: string | null;
  availableCredits: number;
  reservedCredits: number;
  trialEndsAt: string | null;
  resetAt: string | null;
  paidUntil: string | null;
  paymentNeedsAttention: boolean;
  cancelAtPeriodEnd: boolean;
  serverTime: string;
}
export interface PlanCatalog {
  billingAvailable: boolean;
  currency: string;
  creditCostUsd: number;
  plans: Record<
    "trial" | "starter" | "pro" | "agency",
    {
      name: string;
      credits: number | null;
      monthly: number | null;
      yearly: number | null;
      days?: number;
    }
  >;
}
export function notifyBilling(code?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USAGE_CHANGED));
  if (
    code &&
    [
      "TRIAL_EXPIRED",
      "TRIAL_CREDITS_EXHAUSTED",
      "PAID_CREDITS_EXHAUSTED",
      "PAYMENT_REQUIRED",
    ].includes(code)
  )
    window.dispatchEvent(new CustomEvent(UPGRADE_REQUIRED, { detail: code }));
}
export async function billingFetch(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.method === "POST" && !headers.has("Idempotency-Key"))
    headers.set("Idempotency-Key", crypto.randomUUID());
  const response = await fetch(input, { ...init, headers });
  if (response.status === 402) {
    const body = (await response
      .clone()
      .json()
      .catch(() => null)) as { code?: string } | null;
    notifyBilling(body?.code);
  }
  if (init?.method && init.method !== "GET") notifyBilling();
  return response;
}
export async function billingRequest<T>(
  path: string,
  body?: object,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? "POST" : "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Billing is unavailable");
  return data as T;
}
export const currentReturnPath = () =>
  `${window.location.pathname}${window.location.search}`;
export async function navigateBilling(
  kind: "checkout" | "upgrade" | "portal",
  selection?: { plan: "starter" | "pro"; interval: "monthly" | "yearly" },
) {
  const { url } = await billingRequest<{ url: string }>(`/billing/${kind}`, {
    ...selection,
    returnPath: currentReturnPath().startsWith("/workspace")
      ? currentReturnPath()
      : "/workspace",
  });
  window.location.assign(url);
}
