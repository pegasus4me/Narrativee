"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/motion/loader";
import { startStudioResearch, type StudioProject } from "@/lib/api/studio";
import StudioCompetitorPicker from "./StudioCompetitorPicker";

const runningStatuses = new Set([
  "queued",
  "scraping",
  "synthesizing",
  "discovering_competitors",
  "scanning_competitors",
  "comparing_competitors",
]);

function progressText(status: string): string {
  switch (status) {
    case "queued":
      return "Preparing the brand scan…";
    case "scraping":
      return "Reading the website and collecting brand signals…";
    case "synthesizing":
      return "Building an evidence-based brand diagnosis…";
    case "discovering_competitors":
      return "Finding relevant competitors…";
    case "scanning_competitors":
      return "Reading the selected competitor websites…";
    case "comparing_competitors":
      return "Comparing positioning and visual patterns…";
    default:
      return "Exploring the brand…";
  }
}

export default function StudioResearchPanel({
  project,
  busy,
  onUpdated,
  onExplore,
}: {
  project: StudioProject;
  busy: boolean;
  onUpdated: () => void;
  onExplore: () => void;
}) {
  const analysis = project.analysis;
  const isRunning = Boolean(analysis && runningStatuses.has(analysis.status));
  const needsCompetitors =
    analysis?.status === "awaiting_competitor_confirmation" ||
    analysis?.status === "competitor_analysis_failed";
  const canExplore = Boolean(analysis?.competitorAnalysis) && !isRunning;
  const [website, setWebsite] = useState(project.brandUrl ?? "");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setWebsite(project.brandUrl ?? ""), [project.brandUrl]);

  async function startScan() {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      await startStudioResearch(project.id, website.trim() || undefined);
      onUpdated();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not start the scan",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <section aria-label="Brand research" className="mb-6 pb-6 p-2">
      <h2 className="text-sm font-medium text-ink">Brand research</h2>

      {isRunning && analysis && (
        <div className="mt-3 space-y-3" role="status" aria-live="polite">
          <div className="flex items-start gap-2 text-sm leading-6 text-ink-2">
            <Loader variant="dither" size={16} label="Research in progress" />
            <span>{progressText(analysis.status)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-hover-2">
            <div
              className="h-full bg-secondary transition-[width] duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, analysis.progress))}%`,
              }}
            />
          </div>
        </div>
      )}

      {(!analysis || analysis.status === "failed") && (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-6 text-ink-2">
            Scan the website to understand the brand before exploring
            directions.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void startScan();
            }}
            className="flex gap-2"
          >
            <input
              type="url"
              required
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://company.com"
              aria-label="Brand website URL"
              className="min-w-0 flex-1 rounded-lg border border-line-strong bg-field px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            />
            <button
              type="submit"
              disabled={working}
              className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-surface disabled:opacity-50"
            >
              {working ? "Starting…" : "Scan"}
            </button>
          </form>
        </div>
      )}

      {analysis?.diagnosis && (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-6 text-ink-2">
            {analysis.diagnosis.summary}
          </p>
          <details className="text-sm text-ink-2">
            <summary className="cursor-pointer font-medium text-ink">
              Review findings and questions
            </summary>
            <div className="mt-2 space-y-3">
              {analysis.diagnosis.observations.slice(0, 3).map((item) => (
                <p key={`${item.type}-${item.statement}`}>{item.statement}</p>
              ))}
              {analysis.diagnosis.openQuestions.slice(0, 3).map((item) => (
                <p key={item.question} className="border-l-2 border-line pl-3">
                  {item.question}
                </p>
              ))}
            </div>
          </details>
        </div>
      )}

      {needsCompetitors && analysis && (
        <StudioCompetitorPicker analysis={analysis} onUpdated={onUpdated} />
      )}

      {analysis?.competitorAnalysis && (
        <details className="mt-4 text-sm text-ink-2">
          <summary className="cursor-pointer font-medium text-ink">
            Competitor landscape ready
          </summary>
          <div className="mt-2 space-y-2">
            {analysis.competitorAnalysis.categoryPatterns
              .slice(0, 2)
              .map((pattern) => (
                <p key={pattern}>{pattern}</p>
              ))}
            {analysis.competitorAnalysis.differentiationOpportunities
              .slice(0, 2)
              .map((opportunity) => (
                <p key={opportunity}>{opportunity}</p>
              ))}
          </div>
        </details>
      )}

      {(analysis?.error || error) && (
        <p role="alert" className="mt-3 text-xs leading-5 text-destructive">
          {error || analysis?.error}
        </p>
      )}

      {canExplore && (
        <button
          type="button"
          onClick={onExplore}
          disabled={busy}
          className="mt-5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-hover-2 disabled:opacity-50"
        >
          Explore 3 creative directions
        </button>
      )}
    </section>
  );
}
