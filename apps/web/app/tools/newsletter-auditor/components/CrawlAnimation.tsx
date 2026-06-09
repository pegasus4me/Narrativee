"use client";

import { RefreshCw } from "lucide-react";

interface CrawlAnimationProps {
  /** Current step index (1–6) */
  readonly step: number;
}

const CRAWL_STEPS = [
  "Connecting to host...",
  "Crawling HTML structure...",
  "Analyzing copy & CTAs...",
  "Benchmarking against niche...",
  "Calculating revenue projections...",
  "Compiling final report...",
] as const;

/**
 * Animated crawl progress indicator shown while the
 * server action processes the audit request.
 */
export default function CrawlAnimation({ step }: CrawlAnimationProps) {
  return (
    <div className="max-w-md mx-auto rounded-2xl border border-white/5 bg-zinc-900/20 p-8 text-center backdrop-blur-md flex flex-col items-center justify-center min-h-[320px] mb-12 print:hidden">
      <div className="w-14 h-14 rounded-full bg-[#483BFF]/10 border border-[#483BFF]/20 flex items-center justify-center mb-6">
        <RefreshCw size={24} className="text-[#36A5FF] animate-spin" />
      </div>

      <h3 className="text-lg font-bold text-zinc-100 font-display">
        Running Deep Audit
      </h3>
      <p className="text-[11px] text-zinc-500 mt-1">
        Analyzing conversion, SEO, and monetization potential
      </p>

      <div className="mt-6 w-full max-w-xs space-y-2.5">
        {CRAWL_STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = step > stepNum;
          const isActive = step === stepNum;

          return (
            <div key={label} className="flex items-center gap-2.5 text-xs">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isActive
                      ? "bg-[#483BFF]/20 text-[#36A5FF] animate-pulse"
                      : "bg-zinc-800/50 text-zinc-600"
                }`}
              >
                {isCompleted ? "✓" : stepNum}
              </span>
              <span
                className={`transition-colors duration-300 ${
                  isCompleted
                    ? "text-emerald-400 font-semibold"
                    : isActive
                      ? "text-zinc-200 font-medium"
                      : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 w-full max-w-xs h-1 bg-zinc-800/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#483BFF] to-[#36A5FF] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(step / CRAWL_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
