"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, X } from "lucide-react";
import { Loader } from "@/components/motion/loader";
import { useRouter, useSearchParams } from "next/navigation";
import { getSiteAnalysis, type SiteAnalysis } from "@/lib/api/analysis";
import { studioPath } from "@/lib/api/brands";
import { useBrands } from "./BrandProvider";
import BrandScanProgress from "./BrandScanProgress";

const runningStatuses = new Set([
  "queued",
  "scraping",
  "synthesizing",
  "discovering_competitors",
  "scanning_competitors",
  "comparing_competitors",
]);

function statusLabel(analysis: SiteAnalysis | null) {
  if (!analysis) return "Starting your scan…";
  switch (analysis.status) {
    case "queued":
      return "Preparing the brand scan…";
    case "scraping":
      return "Reading the website and collecting brand signals…";
    case "synthesizing":
      return "Building your brand diagnosis…";
    case "discovering_competitors":
      return "Finding relevant competitors…";
    case "scanning_competitors":
      return "Reading competitor websites…";
    case "comparing_competitors":
      return "Comparing the market and creative patterns…";
    default:
      return "Preparing your Studio…";
  }
}

export default function BrandScanDialog() {
  const { active } = useBrands();
  const searchParams = useSearchParams();
  const router = useRouter();
  const open = searchParams.get("scan") === "true";
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analysisId = active?.analysisId;

  useEffect(() => {
    if (!open || !analysisId) {
      setAnalysis(null);
      setError(null);
      return;
    }
    const id = analysisId;

    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const result = await getSiteAnalysis(id);
        if (!mounted) return;
        setAnalysis(result);
        setError(null);
        if (runningStatuses.has(result.status)) timer = setTimeout(poll, 1800);
      } catch (cause) {
        if (mounted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load scan status",
          );
      }
    }

    void poll();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [analysisId, open]);

  function close() {
    if (active?.id) router.replace(studioPath(active.id));
  }

  const failed =
    analysis?.status === "failed" ||
    analysis?.status === "competitor_analysis_failed";
  const complete =
    analysis?.status === "awaiting_competitor_confirmation" ||
    analysis?.status === "completed";

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1200] bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[1201] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-ink shadow-overlay sm:p-8">
          <Dialog.Close
            aria-label="Close scan status"
            className="absolute right-4 top-4 rounded p-1 text-ink-3 hover:bg-hover-2"
          >
            <X size={18} />
          </Dialog.Close>
          {!failed && !error && (
            <div className="mx-auto mb-5 flex size-20 items-center justify-center">
              {complete ? (
                <CheckCircle2
                  size={40}
                  aria-hidden="true"
                  className="text-emerald-500"
                />
              ) : (
                <Loader
                  variant="dither"
                  size={48}
                  label="Brand scan in progress"
                />
              )}
            </div>
          )}
          <Dialog.Title className="px-6 text-center text-xl font-semibold">
            {failed
              ? "The brand scan hit a problem"
              : complete
                ? "Your brand is ready"
                : `Analyzing ${active?.name ?? "your brand"}`}
          </Dialog.Title>
          <Dialog.Description
            className="mt-2 text-center text-sm leading-6 text-ink-2"
            aria-live="polite"
          >
            {failed
              ? (analysis?.error ?? "The website scan could not be completed.")
              : complete
                ? "Your brand context is ready. You can continue working in Studio."
                : (error ?? statusLabel(analysis))}
          </Dialog.Description>
          {!failed && !error && <BrandScanProgress analysis={analysis} />}
          {(complete || failed || error) && (
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface"
            >
              Continue to Studio
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
