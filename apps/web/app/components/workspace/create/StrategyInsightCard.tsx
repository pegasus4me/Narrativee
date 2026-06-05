"use client";

import type { OrchestrationMetadata } from "@/app/types/api";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
interface StrategyInsightCardProps {
  readonly metadata: OrchestrationMetadata;
}

/** Glassmorphic card showing the AI strategy reasoning, angles, and platform direction. */
export function StrategyInsightCard({ metadata }: StrategyInsightCardProps) {
  const { strategy } = metadata;
  const platformEntries = Object.entries(strategy.platformDirection);
  const hasAngles = strategy.selectedAngles.length > 0;
  const hasPlatforms = platformEntries.length > 0;
  const [show, setShow] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6 transition-all duration-300">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setShow(!show)}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#eca8d6]" />
          <span className="text-xs font-mono text-zinc-300">
            AI Strategy
          </span>
        </div>
        <div className="text-zinc-400 hover:text-zinc-200 transition-colors">
          {show ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {show && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Strategy summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-zinc-100">
              Strategy Reasoning
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {strategy.summary}
            </p>
          </div>

          {/* Angles chips */}
          {hasAngles && (
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Selected Angles
              </p>
              <div className="flex flex-wrap gap-2">
                {strategy.selectedAngles.map((angle) => (
                  <span
                    key={angle}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#eca8d6]/20 bg-[#eca8d6]/10 px-3 py-1 text-xs text-[#eca8d6]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6]" />
                    {angle.length > 60 ? `${angle.slice(0, 57)}...` : angle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Platform direction */}
          {hasPlatforms && (
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Platform Direction
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {platformEntries.map(([platform, direction]) => (
                  <div
                    key={platform}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
                  >
                    <p className="text-xs font-semibold text-zinc-200 capitalize">
                      {platform}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      {direction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
