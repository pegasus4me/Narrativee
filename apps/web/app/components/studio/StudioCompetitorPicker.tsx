"use client";

import { useEffect, useState } from "react";
import { confirmCompetitors } from "@/lib/api/analysis";
import type { StudioAnalysis } from "@/lib/api/studio";

export default function StudioCompetitorPicker({
  analysis,
  onUpdated,
}: {
  analysis: StudioAnalysis;
  onUpdated: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [manualUrl, setManualUrl] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(analysis.selectedCompetitorUrls);
  }, [analysis.id, analysis.status]);

  function toggle(url: string) {
    setSelected((current) =>
      current.includes(url)
        ? current.filter((item) => item !== url)
        : current.length < 5
          ? [...current, url]
          : current,
    );
  }

  function addManualUrl() {
    if (!manualUrl.trim() || selected.length >= 5) return;
    try {
      const candidate = manualUrl.match(/^https?:\/\//i)
        ? manualUrl.trim()
        : `https://${manualUrl.trim()}`;
      const url = new URL(candidate);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Unsupported URL protocol");
      }
      setSelected((current) =>
        current.includes(url.toString())
          ? current
          : [...current, url.toString()],
      );
      setManualUrl("");
      setError(null);
    } catch {
      setError("Enter a valid competitor website URL");
    }
  }

  async function compare() {
    if (!selected.length || working) return;
    setWorking(true);
    setError(null);
    try {
      await confirmCompetitors(analysis.id, selected);
      onUpdated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not compare competitors",
      );
    } finally {
      setWorking(false);
    }
  }

  const manualSelections = selected.filter(
    (url) =>
      !analysis.competitorCandidates.some((candidate) => candidate.url === url),
  );

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm font-medium text-ink">
        Choose up to five competitors
      </p>
      <p className="text-xs leading-5 text-ink-3">
        Their websites will be compared with the brand before creative work.
      </p>
      <div className="space-y-1">
        {analysis.competitorCandidates.map((candidate) => (
          <label
            key={candidate.url}
            className="flex cursor-pointer gap-2 border-b border-line py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(candidate.url)}
              disabled={
                working ||
                (!selected.includes(candidate.url) && selected.length >= 5)
              }
              onChange={() => toggle(candidate.url)}
              className="mt-1 accent-black"
            />
            <span className="min-w-0">
              <span className="block font-medium text-ink">
                {candidate.name}
              </span>
              <span className="block truncate text-xs text-ink-3">
                {candidate.url}
              </span>
              <span className="block text-xs leading-5 text-ink-2">
                {candidate.reason}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={manualUrl}
          onChange={(event) => setManualUrl(event.target.value)}
          placeholder="Add competitor URL"
          aria-label="Competitor website URL"
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-field px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        />
        <button
          type="button"
          onClick={addManualUrl}
          disabled={working || selected.length >= 5}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {manualSelections.map((url) => (
        <button
          key={url}
          type="button"
          onClick={() => toggle(url)}
          className="block max-w-full truncate text-xs text-ink-2 underline"
          title="Remove competitor"
        >
          {url} ×
        </button>
      ))}
      {error && (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void compare()}
        disabled={!selected.length || working}
        className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-surface disabled:opacity-50"
      >
        {working ? "Starting comparison…" : "Compare competitors"}
      </button>
    </div>
  );
}
