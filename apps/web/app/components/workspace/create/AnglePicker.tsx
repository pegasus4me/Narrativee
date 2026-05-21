"use client";

import { useState } from "react";
import { Loader2, RefreshCw, ChevronRight, ArrowLeft, Sparkles } from "lucide-react";

interface AnglePickerProps {
  article: { id: string; title: string } | null;
  ideas: string[];
  loading: boolean;
  error: string;
  selectedAngles: Set<number>;
  ideasMeta: { cached?: boolean } | null;
  isGenerating: boolean;
  onToggleAngle: (index: number) => void;
  onReExtract: () => void;
  onGenerate: () => void;
  onBack: () => void;
}

export function AnglePicker({
  article,
  ideas,
  loading,
  error,
  selectedAngles,
  ideasMeta,
  isGenerating,
  onToggleAngle,
  onReExtract,
  onGenerate,
  onBack,
}: AnglePickerProps) {
  if (!article) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin mb-3 text-zinc-600" />
        <p className="text-sm">Extracting social angles from your article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-3 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button type="button" onClick={onReExtract} className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry extraction
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </button>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Content Angles</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Extracted from: <strong className="text-zinc-800 font-semibold">{article.title || "Selected article"}</strong>
            </p>
          </div>
          {ideasMeta?.cached && (
            <button
              type="button"
              onClick={onReExtract}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              Re-extract angles (uses 1 credit)
            </button>
          )}
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-sm text-zinc-500">No angles found. Try re-extracting or choosing a different article.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {ideas.map((idea, idx) => {
              const isSelected = selectedAngles.has(idx);
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => onToggleAngle(idx)}
                    className={`w-full rounded-xl border p-4 text-left text-sm leading-relaxed transition-all ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/5 text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border shrink-0 ${
                        isSelected ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300"
                      }`}>
                        {isSelected && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1">{idea}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
            <p className="text-xs text-zinc-500">
              {selectedAngles.size} of {ideas.length} angles selected
            </p>
            <button
              type="button"
              disabled={selectedAngles.size === 0 || isGenerating}
              onClick={onGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating platform drafts...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Drafts
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
