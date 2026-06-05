"use client";

import type { OrchestrationMetadata } from "@/app/types/api";

/** Human-readable labels and icons for each agent in the pipeline. */
const AGENT_DISPLAY: Record<string, { label: string; icon: string }> = {
  content_strategy: { label: "Strategy", icon: "🧠" },
  content_strategy_agent: { label: "Strategy", icon: "🧠" },
  content_repurposing: { label: "Repurposing", icon: "✍️" },
  content_repurposing_agent: { label: "Repurposing", icon: "✍️" },
  publishing_scheduling: { label: "Publishing", icon: "📤" },
  publishing_scheduling_agent: { label: "Publishing", icon: "📤" },
};

const DEFAULT_DISPLAY = { label: "Agent", icon: "⚙️" };

interface OrchestrationPipelineProps {
  readonly metadata: OrchestrationMetadata;
}

/** Horizontal stepper showing the multi-agent pipeline that produced the drafts. */
export function OrchestrationPipeline({ metadata }: OrchestrationPipelineProps) {
  const steps = metadata.workflowSteps.map((step, index) => {
    const display = AGENT_DISPLAY[step.taskType] ?? DEFAULT_DISPLAY;
    const isCompleted = index < metadata.agentsUsed.length;

    return { ...step, ...display, isCompleted };
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 w-full ">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-[#eca8d6] animate-pulse" />
        <span className="text-xs font-mono ">
          Agent Pipeline
        </span>
      </div>

      <div className="flex items-center gap-0">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            {/* Step card */}
            <div
              className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 w-full transition-all duration-500 ${step.isCompleted
                ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                : "border-white/10 bg-white/[0.02]"
                }`}
            >
              {/* Status dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-500 ${step.isCompleted
                  ? "bg-emerald-400"
                  : "bg-zinc-600"
                  }`}
              />

              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-100 truncate">
                  {step.icon} {step.label}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">
                  {step.isCompleted ? "Complete" : "Pending"}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="w-6 shrink-0 flex items-center justify-center">
                <div
                  className={`h-px w-full transition-colors duration-500 ${step.isCompleted ? "bg-emerald-500/40" : "bg-white/10"
                    }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
