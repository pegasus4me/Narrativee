"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
  Brain,
  Quote,
  Layers,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Compass,
  FileText,
} from "lucide-react";
import {
  getSiteAnalysis,
  type SiteAnalysis,
  type Inference,
  type Observation,
  type Question,
} from "@/lib/api/analysis";
import { authClient } from "@/lib/auth-client";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();

  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);

  // Active question answers state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  // Initialize analysisId from URL or storage
  useEffect(() => {
    const urlId = searchParams.get("analysisId");
    if (urlId) {
      setAnalysisId(urlId);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("current_analysis_id", urlId);
      }
    } else if (typeof window !== "undefined") {
      const storedId =
        window.sessionStorage.getItem("current_analysis_id") ||
        window.localStorage.getItem("current_analysis_id");
      if (storedId) {
        setAnalysisId(storedId);
      }
    }
  }, [searchParams]);

  // Polling logic
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    let isMounted = true;
    setLoading(true);
    setPollingError(null);

    const fetchStatus = async () => {
      try {
        const data = await getSiteAnalysis(analysisId);
        if (!isMounted) return;

        setAnalysis(data);
        setLoading(false);

        // Keep polling if still in progress
        if (data.status === "queued" || data.status === "scraping" || data.status === "synthesizing") {
          pollTimerRef.current = setTimeout(fetchStatus, 1800);
        }
      } catch (err) {
        if (!isMounted) return;
        setPollingError(err instanceof Error ? err.message : "Failed to load analysis");
        setLoading(false);
      }
    };

    void fetchStatus();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [analysisId]);

  const isGuest = !session?.user;

  // 1. NO ANALYSIS ACTIVE: Clean empty canvas
  if (!analysisId && !loading) {
    return <div className="h-full w-full" />;
  }

  // 2. IN PROGRESS: Live progress & pipeline stage indicator
  const isInProgress =
    analysis?.status === "queued" ||
    analysis?.status === "scraping" ||
    analysis?.status === "synthesizing";

  if (isInProgress) {
    const progress = analysis?.progress ?? 0;
    const stage =
      analysis?.status === "scraping"
        ? "Scraping homepage & visual assets..."
        : analysis?.status === "synthesizing"
        ? "Synthesizing evidence-based brand diagnosis with AI..."
        : "Queued for analysis...";

    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6 flex size-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Brain className="size-8 text-emerald-500 dark:text-emerald-400 animate-pulse" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-3">
          <Sparkles className="size-3.5" />
          Evidence-First Engine Running
        </span>

        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Analyzing {analysis?.url}
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-zinc-400 max-w-md">
          {stage}
        </p>

        {/* Progress Bar */}
        <div className="mt-6 w-full max-w-md">
          <div className="flex justify-between text-xs font-medium text-neutral-500 dark:text-zinc-400 mb-1.5">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progress, 8)}%` }}
            />
          </div>
        </div>

        {/* Live Step Checklist */}
        <div className="mt-8 flex flex-col gap-2 text-left w-full max-w-sm">
          <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-zinc-300">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span>Target URL normalized & verified</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-zinc-300">
            {progress >= 55 ? (
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            ) : (
              <Loader2 className="size-4 animate-spin text-emerald-500 shrink-0" />
            )}
            <span>Scraping site structure & brand content</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-zinc-300">
            {progress >= 100 ? (
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            ) : progress >= 55 ? (
              <Loader2 className="size-4 animate-spin text-emerald-500 shrink-0" />
            ) : (
              <div className="size-4 rounded-full border border-zinc-300 dark:border-zinc-700 shrink-0" />
            )}
            <span>Synthesizing observations & inferences with AI</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. FAILED: Error state
  if (analysis?.status === "failed") {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-4">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Analysis Encountered an Issue
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-zinc-400 max-w-md">
          {analysis.error || "Unable to complete site analysis."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full bg-secondary px-5 py-2 text-sm font-medium text-black hover:bg-secondary/90 transition-colors cursor-pointer"
          >
            Try another website on home
          </Link>
        </div>
      </div>
    );
  }

  // 4. COMPLETED: Rich Brand Diagnosis Dashboard
  const diagnosis = analysis?.diagnosis;

  if (!diagnosis) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Guest Mode Banner: Prompts sign up to save diagnosis */}
      {isGuest && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Guest Preview Mode
              </h3>
              <p className="text-xs text-neutral-600 dark:text-zinc-400">
                Create a free account to save this brand diagnosis, edit decisions, and generate tailored brand assets.
              </p>
            </div>
          </div>
          <Link
            href={`/auth/signup?analysisId=${encodeURIComponent(analysis.id)}&website=${encodeURIComponent(
              analysis.url.replace(/^https?:\/\//, "")
            )}`}
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/90 px-4 py-2 text-xs font-semibold text-black transition-all shadow-sm cursor-pointer"
          >
            <span>Save Brand Brain</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              Evidence-Backed Diagnosis
            </span>
            <span className="text-xs text-neutral-400 dark:text-zinc-500">•</span>
            <a
              href={analysis.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              <span>{analysis.url}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {diagnosis.companyName}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-zinc-300 max-w-3xl leading-relaxed">
            {diagnosis.summary}
          </p>
        </div>

        {/* Action button to re-analyze / analyze another site */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Analyze another website</span>
          </Link>
        </div>
      </div>

      {/* Section 1: Positioning & Strategic Inferences */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-emerald-500" />
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            Strategic Inferences & Hypotheses
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diagnosis.inferences.map((inf, idx) => (
            <InferenceCard key={idx} inference={inf} />
          ))}
        </div>
      </section>

      {/* Section 2: Grounded Observations with Quoted Evidence */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-emerald-500" />
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            Grounded Evidence & Observations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagnosis.observations.map((obs, idx) => (
            <ObservationCard key={idx} observation={obs} />
          ))}
        </div>
      </section>

      {/* Section 3: Strategic Contradictions & Open Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Contradictions */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Messaging Contradictions & Tensions
            </h3>
          </div>
          {diagnosis.contradictions.length > 0 ? (
            <ul className="space-y-2.5">
              {diagnosis.contradictions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-zinc-300 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3"
                >
                  <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-500 dark:text-zinc-400 py-4 text-center">
              No significant messaging contradictions detected in the scraped evidence.
            </p>
          )}
        </div>

        {/* High-Leverage Strategic Questions */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="size-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              High-Leverage Strategic Questions
            </h3>
          </div>

          <div className="space-y-4">
            {diagnosis.openQuestions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-3.5 space-y-2"
              >
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                  {q.question}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 italic">
                  Why this matters: {q.reason}
                </p>

                {/* Option selector pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {q.options.map((opt, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === opt;
                    return (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [qIndex]: isSelected ? "" : opt,
                          }))
                        }
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer border ${
                          isSelected
                            ? "bg-secondary text-black border-secondary"
                            : "bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents: Inference Card
function InferenceCard({ inference }: { inference: Inference }) {
  const [showEvidence, setShowEvidence] = useState(false);

  const typeLabels: Record<string, string> = {
    audience: "Target Audience",
    category: "Market Category",
    positioning: "Positioning Angle",
    personality: "Brand Personality",
  };

  const confidencePct = Math.round(inference.confidence * 100);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 capitalize">
          {typeLabels[inference.type] || inference.type}
        </span>
        <span className="text-[11px] font-medium text-neutral-500 dark:text-zinc-400 tabular-nums">
          {confidencePct}% confidence
        </span>
      </div>

      <p className="text-sm font-medium text-neutral-900 dark:text-white leading-snug">
        {inference.statement}
      </p>

      {inference.evidence && inference.evidence.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowEvidence((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <Quote className="size-3" />
            <span>{showEvidence ? "Hide evidence" : `View quoted evidence (${inference.evidence.length})`}</span>
          </button>

          {showEvidence && (
            <div className="mt-2 space-y-2 border-l-2 border-emerald-500/40 pl-3 pt-1">
              {inference.evidence.map((ev, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <p className="text-neutral-700 dark:text-zinc-300 font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800/80 p-2 rounded">
                    &ldquo;{ev.sourceText}&rdquo;
                  </p>
                  <p className="text-[10px] text-neutral-400 dark:text-zinc-500 truncate">
                    Source: {ev.sourceUrl}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponents: Observation Card
function ObservationCard({ observation }: { observation: Observation }) {
  const [showEvidence, setShowEvidence] = useState(false);

  const typeLabels: Record<string, string> = {
    product: "Product Offering",
    audience_signal: "Audience Signal",
    claim: "Core Claim",
    proof: "Proof Point",
    voice: "Voice & Tone",
    visual: "Visual Identity",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30 p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300">
          {typeLabels[observation.type] || observation.type}
        </span>
        <span className="text-[10px] text-neutral-400 tabular-nums">
          {Math.round(observation.confidence * 100)}%
        </span>
      </div>

      <p className="text-xs text-neutral-800 dark:text-zinc-200 font-medium">
        {observation.statement}
      </p>

      {observation.evidence && observation.evidence.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowEvidence((prev) => !prev)}
            className="text-[10px] text-neutral-500 dark:text-zinc-400 hover:text-emerald-500 cursor-pointer underline"
          >
            {showEvidence ? "Hide quote" : "Quoted source"}
          </button>
          {showEvidence && (
            <p className="mt-1.5 text-[11px] font-mono text-neutral-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded">
              &ldquo;{observation.evidence[0]?.sourceText}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage(): React.ReactNode {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}

