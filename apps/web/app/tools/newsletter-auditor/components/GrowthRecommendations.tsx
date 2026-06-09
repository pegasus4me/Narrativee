"use client";

import { AlertTriangle, AlertOctagon, Lightbulb, CheckCircle2, ArrowUpRight } from "lucide-react";
import type { Recommendation } from "../../../actions/audit";

interface GrowthRecommendationsProps {
  /** Full sorted list of recommendations */
  readonly recommendations: Recommendation[];
  /** Whether to show the full list or only the first N items */
  readonly isLocked: boolean;
  /** How many items to show when locked */
  readonly visibleCount?: number;
}

const PRIORITY_CONFIG = {
  critical: {
    icon: <AlertOctagon size={13} />,
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  high: {
    icon: <AlertTriangle size={13} />,
    label: "High Impact",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  medium: {
    icon: <Lightbulb size={13} />,
    label: "Medium",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  low: {
    icon: <CheckCircle2 size={13} />,
    label: "Quick Win",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
  },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  landing_page: "Landing Page",
  headline: "Headline",
  social_proof: "Social Proof",
  seo: "SEO",
  content: "Content",
  monetization: "Monetization",
};

/**
 * Prioritized recommendation checklist with impact labels.
 * Shows a limited number of items for unauthenticated users.
 */
export default function GrowthRecommendations({
  recommendations,
  isLocked,
  visibleCount = 4,
}: GrowthRecommendationsProps) {
  const visibleRecs = isLocked ? recommendations.slice(0, visibleCount) : recommendations;
  const hiddenCount = isLocked ? Math.max(0, recommendations.length - visibleCount) : 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-6 md:p-8 backdrop-blur-md print:border-zinc-200 print:bg-white">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
          <ArrowUpRight size={13} className="text-[#36A5FF]" />
          Prioritized Action Plan
        </h3>
        <span className="text-[10px] text-zinc-600 font-medium">
          {recommendations.length} recommendation{recommendations.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {visibleRecs.map((rec) => {
          const config = PRIORITY_CONFIG[rec.priority];
          return (
            <div
              key={rec.id}
              className={`rounded-xl border ${config.border} ${config.bg} p-4 print:border-zinc-200 print:bg-white`}
            >
              <div className="flex items-start gap-3">
                {/* Priority badge */}
                <div className={`shrink-0 mt-0.5 ${config.color}`}>
                  {config.icon}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Category + priority label */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">
                      {CATEGORY_LABELS[rec.category] || rec.category}
                    </span>
                    <span className={`text-[8px] ${config.color} uppercase tracking-wider font-bold`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-zinc-200 print:text-black">
                    {rec.title}
                  </h4>

                  {/* Description */}
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-1 print:text-zinc-600">
                    {rec.description}
                  </p>

                  {/* Impact badge */}
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-zinc-400 font-medium">
                    <ArrowUpRight size={8} />
                    {rec.impact}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Hidden count indicator */}
        {hiddenCount > 0 && (
          <div className="text-center py-3 text-[11px] text-zinc-600">
            + {hiddenCount} more recommendation{hiddenCount !== 1 ? "s" : ""} available after signup
          </div>
        )}
      </div>
    </div>
  );
}
