"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { OrchestrationMetadata } from "@/app/types/api";

interface OrchestrationDetailPanelProps {
  readonly metadata: OrchestrationMetadata;
}

/**
 * Expandable "How it was made" panel showing RAG context, memories,
 * workflow plan, and warnings from the orchestration pipeline.
 */
export function OrchestrationDetailPanel({ metadata }: OrchestrationDetailPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasRag = metadata.ragContextUsed.length > 0;
  const hasMemories = metadata.memoriesUsed.length > 0;
  const hasWarnings = metadata.warnings.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono">
            How it was made
          </span>
          {hasWarnings && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
              {metadata.warnings.length} warning{metadata.warnings.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {/* Collapsible content */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-5">
            {/* Workflow plan */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Workflow Plan
              </p>
              <div className="space-y-2">
                {metadata.workflowSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 text-xs text-zinc-400"
                  >
                    <span className="font-mono text-zinc-600 w-5 shrink-0 text-right">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="text-zinc-300 font-medium">
                        {step.taskType.replace(/_/g, " ")}
                      </span>
                      {step.description !== step.taskType && (
                        <span className="text-zinc-500 ml-2">— {step.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RAG context */}
            {hasRag && (
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                  RAG Context Retrieved
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {metadata.ragContextUsed.map((ctx, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {ctx.source}
                        </span>
                        <span className="text-[10px] font-mono text-[#eca8d6]">
                          score: {ctx.score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">
                        {ctx.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memories */}
            {hasMemories && (
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                  Memories Used
                </p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {metadata.memoriesUsed.map((mem, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
                    >
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-500 shrink-0">
                        {mem.type}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                        {mem.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {hasWarnings && (
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-amber-400">
                  Warnings
                </p>
                <ul className="space-y-1.5">
                  {metadata.warnings.map((warning, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-[11px] text-amber-300/80 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
