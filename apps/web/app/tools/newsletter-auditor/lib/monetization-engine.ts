/**
 * Revenue projection calculator for newsletter monetization.
 *
 * Takes subscriber count + niche and produces low/mid/high
 * revenue estimates across sponsorship, paid subs, and affiliate channels.
 */

import { type NicheKey, NICHE_BENCHMARKS } from "./niche-benchmarks";

/** Revenue range with low, mid, and high estimates */
export interface RevenueRange {
  readonly low: number;
  readonly mid: number;
  readonly high: number;
}

/** Complete monetization projection output */
export interface MonetizationProjection {
  /** Revenue per single sponsored newsletter issue */
  readonly sponsorshipPerIssue: RevenueRange;

  /** Monthly sponsorship revenue (per-issue × issues/month) */
  readonly sponsorshipMonthly: RevenueRange;

  /** Monthly paid subscription revenue projection */
  readonly paidSubscriptionMonthly: RevenueRange;

  /** Monthly affiliate marketing revenue projection */
  readonly affiliateMonthly: RevenueRange;

  /** Combined mid-range ceiling across all channels */
  readonly totalCeiling: number;

  /** CPM rates for the selected niche */
  readonly nicheCpm: RevenueRange;

  /** Estimated open rate for the niche */
  readonly estimatedOpenRate: number;

  /** Issues per month benchmark */
  readonly issuesPerMonth: number;

  /** Human-readable context note */
  readonly benchmarkNote: string;
}

/**
 * Calculates monetization projections for a newsletter.
 *
 * @param subscriberCount - Total email subscriber count
 * @param niche - Newsletter niche identifier
 * @param customOpenRate - Optional override for open rate (0–1)
 * @returns Full monetization projection with revenue ranges
 */
export function calculateMonetization(
  subscriberCount: number,
  niche: NicheKey,
  customOpenRate?: number
): MonetizationProjection {
  const benchmark = NICHE_BENCHMARKS[niche];
  const openRate = customOpenRate ?? benchmark.openRate;
  const opens = subscriberCount * openRate;

  // --- Sponsorship Revenue ---
  // Formula: (opens / 1000) × CPM
  const sponsorshipPerIssue: RevenueRange = {
    low: Math.round((opens / 1000) * benchmark.cpm.low),
    mid: Math.round((opens / 1000) * benchmark.cpm.mid),
    high: Math.round((opens / 1000) * benchmark.cpm.high),
  };

  const sponsorshipMonthly: RevenueRange = {
    low: sponsorshipPerIssue.low * benchmark.issuesPerMonth,
    mid: sponsorshipPerIssue.mid * benchmark.issuesPerMonth,
    high: sponsorshipPerIssue.high * benchmark.issuesPerMonth,
  };

  // --- Paid Subscription Revenue ---
  // Formula: subscribers × conversion_rate × monthly_price
  const paidSubscriptionMonthly: RevenueRange = {
    low: Math.round(subscriberCount * benchmark.paidConversion.low * benchmark.avgPaidPrice),
    mid: Math.round(subscriberCount * benchmark.paidConversion.mid * benchmark.avgPaidPrice),
    high: Math.round(subscriberCount * benchmark.paidConversion.high * benchmark.avgPaidPrice),
  };

  // --- Affiliate Revenue ---
  // Formula: opens × click_rate × commission_rate × AOV × issues/month
  const affiliateMonthly: RevenueRange = {
    low: Math.round(
      opens * benchmark.clickRate * benchmark.affiliateCommission.low * benchmark.affiliateAov * benchmark.issuesPerMonth
    ),
    mid: Math.round(
      opens * benchmark.clickRate * benchmark.affiliateCommission.mid * benchmark.affiliateAov * benchmark.issuesPerMonth
    ),
    high: Math.round(
      opens * benchmark.clickRate * benchmark.affiliateCommission.high * benchmark.affiliateAov * benchmark.issuesPerMonth
    ),
  };

  // --- Total Ceiling ---
  // Sum of all mid-range monthly projections
  const totalCeiling = sponsorshipMonthly.mid + paidSubscriptionMonthly.mid + affiliateMonthly.mid;

  return {
    sponsorshipPerIssue,
    sponsorshipMonthly,
    paidSubscriptionMonthly,
    affiliateMonthly,
    totalCeiling,
    nicheCpm: benchmark.cpm,
    estimatedOpenRate: openRate,
    issuesPerMonth: benchmark.issuesPerMonth,
    benchmarkNote: `Based on ${benchmark.label} industry averages (${Math.round(openRate * 100)}% open rate, ${benchmark.issuesPerMonth} issues/mo). Actual results vary by audience quality and engagement.`,
  };
}

/**
 * Formats a dollar amount for display.
 * @param amount - Dollar amount
 * @returns Formatted string (e.g. "$1,250")
 */
export function formatRevenue(amount: number): string {
  if (amount >= 1000) {
    return `$${amount.toLocaleString("en-US")}`;
  }
  return `$${amount}`;
}
