/**
 * Industry benchmark data for newsletter monetization projections.
 *
 * Sources: Sparkloop Creator Network, Beehiiv Ads Marketplace,
 * Newsletter Sponsorship Index (2024–2025 aggregates).
 *
 * All values are approximations — actual results vary by
 * audience quality, engagement, and advertiser demand.
 */

/** Supported niche identifiers for the audit tool */
export type NicheKey =
  | "finance"
  | "tech"
  | "marketing"
  | "health"
  | "creator_economy"
  | "ai_ml"
  | "crypto"
  | "business"
  | "lifestyle"
  | "other";

export interface NicheBenchmark {
  /** Human-readable niche label */
  readonly label: string;

  /** CPM (cost per 1,000 opens) range in USD */
  readonly cpm: { readonly low: number; readonly mid: number; readonly high: number };

  /** Average email open rate (0–1 decimal) */
  readonly openRate: number;

  /** Click-through rate as fraction of opens */
  readonly clickRate: number;

  /** Percentage of free subscribers who convert to paid (0–1 decimal) */
  readonly paidConversion: { readonly low: number; readonly mid: number; readonly high: number };

  /** Average monthly price for paid tier (USD) */
  readonly avgPaidPrice: number;

  /** Affiliate commission rate as fraction of order value */
  readonly affiliateCommission: { readonly low: number; readonly mid: number; readonly high: number };

  /** Typical affiliate average order value (USD) */
  readonly affiliateAov: number;

  /** Suggested newsletter frequency (issues per month) */
  readonly issuesPerMonth: number;
}

/**
 * Niche selector options rendered in the dropdown UI.
 * Order matches the visual display in the form.
 */
export const NICHE_OPTIONS: readonly { readonly value: NicheKey; readonly label: string }[] = [
  { value: "finance", label: "Finance & Investing" },
  { value: "tech", label: "Tech & SaaS" },
  { value: "ai_ml", label: "AI & Machine Learning" },
  { value: "crypto", label: "Crypto & Web3" },
  { value: "marketing", label: "Marketing & Growth" },
  { value: "business", label: "Business & Entrepreneurship" },
  { value: "creator_economy", label: "Creator Economy" },
  { value: "health", label: "Health & Wellness" },
  { value: "lifestyle", label: "Lifestyle & Culture" },
  { value: "other", label: "Other / General" },
] as const;

/**
 * Benchmark lookup table keyed by niche.
 * Each entry contains monetization parameters used
 * by the revenue projection engine.
 */
export const NICHE_BENCHMARKS: Record<NicheKey, NicheBenchmark> = {
  finance: {
    label: "Finance & Investing",
    cpm: { low: 50, mid: 75, high: 100 },
    openRate: 0.38,
    clickRate: 0.035,
    paidConversion: { low: 0.08, mid: 0.10, high: 0.12 },
    avgPaidPrice: 12,
    affiliateCommission: { low: 0.05, mid: 0.10, high: 0.15 },
    affiliateAov: 200,
    issuesPerMonth: 8,
  },
  tech: {
    label: "Tech & SaaS",
    cpm: { low: 30, mid: 45, high: 60 },
    openRate: 0.35,
    clickRate: 0.03,
    paidConversion: { low: 0.06, mid: 0.08, high: 0.10 },
    avgPaidPrice: 10,
    affiliateCommission: { low: 0.03, mid: 0.065, high: 0.10 },
    affiliateAov: 150,
    issuesPerMonth: 8,
  },
  ai_ml: {
    label: "AI & Machine Learning",
    cpm: { low: 40, mid: 60, high: 80 },
    openRate: 0.36,
    clickRate: 0.032,
    paidConversion: { low: 0.07, mid: 0.09, high: 0.11 },
    avgPaidPrice: 12,
    affiliateCommission: { low: 0.03, mid: 0.055, high: 0.08 },
    affiliateAov: 180,
    issuesPerMonth: 8,
  },
  crypto: {
    label: "Crypto & Web3",
    cpm: { low: 45, mid: 67, high: 90 },
    openRate: 0.34,
    clickRate: 0.03,
    paidConversion: { low: 0.06, mid: 0.08, high: 0.10 },
    avgPaidPrice: 15,
    affiliateCommission: { low: 0.05, mid: 0.085, high: 0.12 },
    affiliateAov: 250,
    issuesPerMonth: 8,
  },
  marketing: {
    label: "Marketing & Growth",
    cpm: { low: 25, mid: 37, high: 50 },
    openRate: 0.32,
    clickRate: 0.028,
    paidConversion: { low: 0.05, mid: 0.065, high: 0.08 },
    avgPaidPrice: 10,
    affiliateCommission: { low: 0.04, mid: 0.08, high: 0.12 },
    affiliateAov: 120,
    issuesPerMonth: 4,
  },
  business: {
    label: "Business & Entrepreneurship",
    cpm: { low: 30, mid: 42, high: 55 },
    openRate: 0.30,
    clickRate: 0.025,
    paidConversion: { low: 0.05, mid: 0.07, high: 0.09 },
    avgPaidPrice: 10,
    affiliateCommission: { low: 0.04, mid: 0.07, high: 0.10 },
    affiliateAov: 130,
    issuesPerMonth: 4,
  },
  creator_economy: {
    label: "Creator Economy",
    cpm: { low: 25, mid: 35, high: 45 },
    openRate: 0.30,
    clickRate: 0.028,
    paidConversion: { low: 0.05, mid: 0.07, high: 0.09 },
    avgPaidPrice: 8,
    affiliateCommission: { low: 0.04, mid: 0.07, high: 0.10 },
    affiliateAov: 100,
    issuesPerMonth: 4,
  },
  health: {
    label: "Health & Wellness",
    cpm: { low: 20, mid: 30, high: 40 },
    openRate: 0.28,
    clickRate: 0.025,
    paidConversion: { low: 0.04, mid: 0.055, high: 0.07 },
    avgPaidPrice: 8,
    affiliateCommission: { low: 0.05, mid: 0.10, high: 0.15 },
    affiliateAov: 80,
    issuesPerMonth: 4,
  },
  lifestyle: {
    label: "Lifestyle & Culture",
    cpm: { low: 15, mid: 22, high: 30 },
    openRate: 0.25,
    clickRate: 0.022,
    paidConversion: { low: 0.03, mid: 0.045, high: 0.06 },
    avgPaidPrice: 7,
    affiliateCommission: { low: 0.05, mid: 0.10, high: 0.15 },
    affiliateAov: 60,
    issuesPerMonth: 4,
  },
  other: {
    label: "Other / General",
    cpm: { low: 15, mid: 20, high: 25 },
    openRate: 0.22,
    clickRate: 0.02,
    paidConversion: { low: 0.03, mid: 0.04, high: 0.05 },
    avgPaidPrice: 7,
    affiliateCommission: { low: 0.03, mid: 0.055, high: 0.08 },
    affiliateAov: 50,
    issuesPerMonth: 4,
  },
} as const;
