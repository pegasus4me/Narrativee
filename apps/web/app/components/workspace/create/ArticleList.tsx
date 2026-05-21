"use client";

import { Loader2, RefreshCw, ArrowRight, Rss, Sparkles, ArrowUpRight, RotateCcw, Lightbulb } from "lucide-react";
import Link from "next/link";

interface ArticleItem {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  sourceId?: string;
  createdAt?: string;
  angleCount?: number;
  draftCount?: number;
  sourcePlatform?: string;
}

interface ArticleListProps {
  articles: ArticleItem[];
  loading: boolean;
  error: string;
  selectedId?: string;
  loadingIdeasForId?: string;
  onSelect: (article: ArticleItem, force: boolean) => void;
  onRefresh: () => void;
}

export function ArticleList({
  articles,
  loading,
  error,
  selectedId,
  loadingIdeasForId,
  onSelect,
  onRefresh,
}: ArticleListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin mb-3 text-zinc-600" />
        <p className="text-sm">Syncing newsletter feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-3 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl px-8 py-16 text-center bg-zinc-50/80">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 mb-4">
          <Rss className="h-7 w-7 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900">No articles found</h3>
        <p className="mt-2 max-w-xs text-sm text-zinc-500 leading-relaxed">
          Connect a Substack or blog to fetch your newsletter issues.
        </p>
        <Link
          href="/workspace/channels"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Go to Channels
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Pick an Issue</h2>
          <p className="mt-1 text-sm text-zinc-500">Choose a synced newsletter to extract social media angles from.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 shrink-0"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => {
          const isSelected = selectedId === article.id;
          const isLoading = loadingIdeasForId === article.id;

          return (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onSelect(article, false)}
                disabled={isLoading}
                className={`flex h-full w-full flex-col rounded-xl border p-5 text-left transition-all ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/5"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                } ${isLoading ? "animate-pulse" : ""}`}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="rounded-md bg-orange-50 border border-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 uppercase">
                    {article.sourcePlatform || "Newsletter"}
                  </span>
                  {(article.angleCount ?? 0) > 0 && (
                    <span className="rounded-md bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 flex items-center gap-0.5">
                      <Sparkles className="h-2.5 w-2.5" />
                      {article.angleCount} angles
                    </span>
                  )}
                  {(article.draftCount ?? 0) > 0 && (
                    <span className="rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                      {article.draftCount} drafts
                    </span>
                  )}
                </div>

                <h3 className="flex-1 text-sm font-semibold text-zinc-900 leading-snug line-clamp-3">
                  {article.title || "Untitled article"}
                </h3>

                <div className="mt-4 flex items-end justify-between">
                  <time className="text-[10px] text-zinc-400 font-medium">
                    {new Date(article.publishedAt || article.createdAt || Date.now()).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </time>
                  <div className="flex items-center gap-1.5">
                    {(article.draftCount ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                        <ArrowUpRight className="h-2.5 w-2.5" />
                        View Drafts
                      </span>
                    ) : (article.angleCount ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 rounded-full px-2 py-0.5">
                        <RotateCcw className="h-2.5 w-2.5" />
                        Load Angles
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 rounded-full px-2 py-0.5">
                        <Lightbulb className="h-2.5 w-2.5" />
                        Extract Angles
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
