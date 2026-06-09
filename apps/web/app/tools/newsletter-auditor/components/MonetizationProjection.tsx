"use client";

import { DollarSign, TrendingUp, Megaphone, CreditCard, Link2, Info } from "lucide-react";
import type { MonetizationProjection } from "../lib/monetization-engine";
import { formatRevenue } from "../lib/monetization-engine";
import { NICHE_BENCHMARKS, type NicheKey } from "../lib/niche-benchmarks";

interface MonetizationProjectionProps {
  readonly monetization: MonetizationProjection;
  readonly subscriberCount: number;
  readonly niche: NicheKey;
}

interface RevenueCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly subtitle: string;
  readonly low: number;
  readonly mid: number;
  readonly high: number;
  readonly period: string;
}

function RevenueCard({ icon, title, subtitle, low, mid, high, period }: RevenueCardProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-5 flex flex-col gap-3 print:border-zinc-200 print:bg-white">
      <div className="flex items-center gap-2">
        <span className="text-[#36A5FF]">{icon}</span>
        <div>
          <span className="text-[11px] font-bold text-zinc-300 block print:text-black">{title}</span>
          <span className="text-[9px] text-zinc-600">{subtitle}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold font-display text-white print:text-black">
          {formatRevenue(mid)}
        </span>
        <span className="text-[10px] text-zinc-500 font-medium">/{period}</span>
      </div>

      <div className="flex items-center gap-2 text-[9px]">
        <span className="text-zinc-600">Range:</span>
        <span className="text-zinc-400 font-mono tabular-nums">
          {formatRevenue(low)} – {formatRevenue(high)}
        </span>
      </div>
    </div>
  );
}

/**
 * Monetization projections section showing revenue estimates
 * across sponsorship, paid subscriptions, and affiliate channels.
 */
export default function MonetizationProjectionSection({ monetization, subscriberCount, niche }: MonetizationProjectionProps) {
  const benchmark = NICHE_BENCHMARKS[niche];

  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-6 md:p-8 backdrop-blur-md print:border-zinc-200 print:bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 print:text-black">
            <TrendingUp size={14} className="text-emerald-400" />
            Monetization Potential
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            Projected revenue for {subscriberCount.toLocaleString()} subscribers in {benchmark.label}
          </p>
        </div>

        {/* Total ceiling badge */}
        <div className="shrink-0 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
          <span className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-semibold block">
            Revenue Ceiling
          </span>
          <span className="text-xl font-extrabold font-display text-emerald-400 block mt-0.5">
            {formatRevenue(monetization.totalCeiling)}
            <span className="text-[10px] font-medium text-emerald-400/60">/mo</span>
          </span>
        </div>
      </div>

      {/* Revenue Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <RevenueCard
          icon={<Megaphone size={14} />}
          title="Sponsorships"
          subtitle={`${monetization.issuesPerMonth} issues/mo × CPM $${monetization.nicheCpm.mid}`}
          low={monetization.sponsorshipMonthly.low}
          mid={monetization.sponsorshipMonthly.mid}
          high={monetization.sponsorshipMonthly.high}
          period="mo"
        />
        <RevenueCard
          icon={<CreditCard size={14} />}
          title="Paid Subscribers"
          subtitle={`${Math.round(benchmark.paidConversion.mid * 100)}% conversion × $${benchmark.avgPaidPrice}/mo`}
          low={monetization.paidSubscriptionMonthly.low}
          mid={monetization.paidSubscriptionMonthly.mid}
          high={monetization.paidSubscriptionMonthly.high}
          period="mo"
        />
        <RevenueCard
          icon={<Link2 size={14} />}
          title="Affiliate Revenue"
          subtitle={`${Math.round(benchmark.affiliateCommission.mid * 100)}% commission × $${benchmark.affiliateAov} AOV`}
          low={monetization.affiliateMonthly.low}
          mid={monetization.affiliateMonthly.mid}
          high={monetization.affiliateMonthly.high}
          period="mo"
        />
      </div>

      {/* Per-issue callout */}
      <div className="rounded-lg border border-white/5 bg-zinc-950/40 p-4 flex items-start gap-3 mb-4">
        <DollarSign size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-200 font-semibold">Per-issue sponsorship value: </span>
          {formatRevenue(monetization.sponsorshipPerIssue.low)} – {formatRevenue(monetization.sponsorshipPerIssue.high)} per send
          <span className="text-zinc-600"> (based on {Math.round(monetization.estimatedOpenRate * 100)}% avg open rate)</span>
        </div>
      </div>

      {/* Benchmark note */}
      <div className="flex items-start gap-2 text-[10px] text-zinc-600">
        <Info size={10} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">{monetization.benchmarkNote}</span>
      </div>
    </div>
  );
}
