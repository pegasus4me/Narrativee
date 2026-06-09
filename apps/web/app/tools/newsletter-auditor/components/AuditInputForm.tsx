"use client";

import { Sparkles, ChevronDown } from "lucide-react";
import { NICHE_OPTIONS, type NicheKey } from "../lib/niche-benchmarks";

interface AuditInputFormProps {
  readonly urlInput: string;
  readonly subscriberCount: string;
  readonly openRate: string;
  readonly niche: NicheKey;
  readonly isLoading: boolean;
  readonly onUrlChange: (value: string) => void;
  readonly onSubscriberChange: (value: string) => void;
  readonly onOpenRateChange: (value: string) => void;
  readonly onNicheChange: (value: NicheKey) => void;
  readonly onSubmit: () => void;
}

/**
 * Four-field input form: URL, subscriber count, open rate, and niche dropdown.
 * Includes the hero title and subtitle for the audit tool page.
 */
export default function AuditInputForm({
  urlInput,
  subscriberCount,
  openRate,
  niche,
  isLoading,
  onUrlChange,
  onSubscriberChange,
  onOpenRateChange,
  onNicheChange,
  onSubmit,
}: AuditInputFormProps) {
  const isReady = urlInput.trim().length > 0 && subscriberCount.trim().length > 0 && Number(subscriberCount) > 0;

  return (
    <div className="text-center max-w-3xl mx-auto mb-16 print:hidden mt-20">

      <h1 className="text-4xl md:text-5xl font-base font-display text-white leading-tight">
        Newsletter Growth & Monetization Audit

      </h1>
      <p className="text-white/60 mt-4 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
        Enter your newsletter details to get deep conversion insights, sponsorship revenue projections, and a prioritized action plan to grow faster.
      </p>

      {/* Input Fields */}
      <div className="mt-10 max-w-xl mx-auto space-y-3">
        {/* URL */}
        <div className="relative">
          <input
            id="audit-url-input"
            type="text"
            placeholder="Newsletter URL (e.g. morningbrew.com)"
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-white/5 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#483BFF]/50 transition-all disabled:opacity-40"
          />
        </div>

        {/* Subscribers + Niche row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            id="audit-subscriber-input"
            type="number"
            placeholder="Total subscribers (e.g. 5000)"
            value={subscriberCount}
            onChange={(e) => onSubscriberChange(e.target.value)}
            disabled={isLoading}
            min={0}
            className="w-full rounded-xl border border-white/5 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#483BFF]/50 transition-all disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <div className="relative">
            <select
              id="audit-niche-select"
              value={niche}
              onChange={(e) => onNicheChange(e.target.value as NicheKey)}
              disabled={isLoading}
              className="w-full appearance-none rounded-xl border border-white/5 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#483BFF]/50 transition-all disabled:opacity-40 cursor-pointer"
            >
              {NICHE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Open Rate */}
        <input
          id="audit-openrate-input"
          type="number"
          placeholder="Avg. open rate % (e.g. 35)"
          value={openRate}
          onChange={(e) => onOpenRateChange(e.target.value)}
          disabled={isLoading}
          min={0}
          max={100}
          className="w-full rounded-xl border border-white/5 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#483BFF]/50 transition-all disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {/* Submit */}
        <button
          id="audit-submit-button"
          onClick={onSubmit}
          disabled={isLoading || !isReady}
          className="w-full rounded-xl bg-gradient-to-r bg-brand px-6 py-3.5 font-base text-sm text-white hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed mt-1"
        >
          <span>Run Full Audit</span>
        </button>

        <p className="text-[10px] text-zinc-600 mt-2">
          Your data is never stored. The audit runs in real-time and results are only visible to you.
        </p>
      </div>
    </div>
  );
}
