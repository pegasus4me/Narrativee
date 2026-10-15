import { CheckCircle2, Circle } from "lucide-react";
import { Loader } from "@/components/motion/loader";
import type { SiteAnalysis } from "@/lib/api/analysis";

const brandSteps = [
  { status: "queued", label: "Prepare the brand scan" },
  { status: "scraping", label: "Read website content and visual assets" },
  { status: "synthesizing", label: "Build your brand diagnosis" },
  { status: "discovering_competitors", label: "Find relevant competitors" },
];
const competitorSteps = [
  { status: "scanning_competitors", label: "Read competitor websites" },
  { status: "comparing_competitors", label: "Compare positioning and visuals" },
];

export default function BrandScanProgress({
  analysis,
}: {
  analysis: Pick<SiteAnalysis, "status" | "progress"> | null;
}) {
  const status = analysis?.status ?? "queued";
  const complete =
    status === "awaiting_competitor_confirmation" || status === "completed";
  const steps =
    status === "scanning_competitors" ||
    status === "comparing_competitors" ||
    status === "completed"
      ? competitorSteps
      : brandSteps;
  const current = steps.findIndex((step) => step.status === status);
  const progress = Math.max(0, Math.min(100, analysis?.progress ?? 0));

  return (
    <div className="mt-6 space-y-6">
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium text-ink-2">
          <span>{complete ? "Scan complete" : "Live progress"}</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Brand scan progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-2 overflow-hidden rounded-full bg-hover-2"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <ol aria-label="Scan stages" className="space-y-3">
        {steps.map((step, index) => {
          const done = complete || index < current;
          const active = !complete && index === current;
          const Icon = done ? CheckCircle2 : Circle;
          return (
            <li
              key={step.status}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-3 text-sm ${done || active ? "text-ink" : "text-ink-3"}`}
            >
              {active ? (
                <Loader
                  variant="dither"
                  size={17}
                  label={`${step.label} in progress`}
                  className="shrink-0"
                />
              ) : (
                <Icon
                  aria-hidden="true"
                  size={17}
                  className={`shrink-0 ${done ? "text-emerald-500" : ""}`}
                />
              )}
              <span>{step.label}</span>
              <span className="sr-only">
                {done ? "Completed" : active ? "In progress" : "Pending"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
