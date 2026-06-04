"use client";

import { Loader2, RefreshCw, ArrowRight, Rss, Sparkles, ArrowUpRight, RotateCcw, Lightbulb } from "lucide-react";
import Link from "next/link";
import type { ArticleListItem } from "@/app/types/api";
import { 
  SUBSTACK_LOGO, 
  MEDIUM_LOGO,
  LINKEDIN_LOGO,
  X_LOGO,
  INSTAGRAM_LOGO,
  THREADS_LOGO,
  FACEBOOK_LOGO,
  BLUESKY_LOGO 
} from "@/app/constants";
import Image from "next/image";
interface ArticleListProps {
  articles: ArticleListItem[];
  loading: boolean;
  error: string;
  selectedId?: string;
  loadingIdeasForId?: string;
  onSelect: (article: ArticleListItem, force: boolean) => void;
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
      <div className="flex flex-col items-center justify-center rounded-2xl px-8 py-16 text-center bg-zinc-950/40 border border-zinc-800/80">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
          <Rss className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-200">No articles found</h3>
        <p className="mt-2 max-w-xs text-sm text-zinc-400 leading-relaxed">
          Connect a Substack or blog to fetch your newsletter issues.
        </p>
        <Link
          href="/workspace/channels"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#e99ab1] hover:bg-[#e99ab1]/90 px-5 py-2.5 text-sm font-bold text-white transition-colors"
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
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100 hover:bg-zinc-900/50 shrink-0"
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
                className={`flex h-full w-full rounded-md flex-col border p-5 text-left transition-all ${isSelected
                  ? "border-[#e99ab1] bg-[#e99ab1]/5 ring-1 ring-[#e99ab1]/10"
                  : "border-zinc-800 bg-zinc-950/40 text-white hover:border-zinc-700 hover:shadow-md"
                  } ${isLoading ? "animate-pulse" : ""}`}
              >
                <div className="flex items-center gap-1.5  mb-3">
                  {(() => {
                    const platform = (article.sourcePlatform || "").toLowerCase();
                    let logoSrc = null;
                    if (platform === "substack") logoSrc = SUBSTACK_LOGO;
                    else if (platform === "medium") logoSrc = MEDIUM_LOGO;
                    else if (platform === "linkedin") logoSrc = LINKEDIN_LOGO;
                    else if (platform === "twitter" || platform === "x") logoSrc = X_LOGO;
                    else if (platform === "instagram") logoSrc = INSTAGRAM_LOGO;
                    else if (platform === "threads") logoSrc = THREADS_LOGO;
                    else if (platform === "facebook") logoSrc = FACEBOOK_LOGO;
                    else if (platform === "bluesky") logoSrc = BLUESKY_LOGO;

                    if (logoSrc) {
                      return (
                        <span className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 capitalize">
                          <Image src={logoSrc} alt={article.sourcePlatform || "Source"} width={16} height={16} unoptimized className="h-3.5 w-3.5 object-contain rounded-full" />
                          {article.sourcePlatform}
                        </span>
                      );
                    }
                    return (
                      <span className="rounded-md bg-orange-950/40 border border-orange-900/50 px-1.5 py-0.5 text-[9px] font-bold text-orange-400 uppercase">
                        {article.sourcePlatform || "Newsletter"}
                      </span>
                    );
                  })()}
                  {(article.angleCount ?? 0) > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] flex items-center gap-0.5 text-zinc-300">
                      {article.angleCount} angles
                    </span>
                  )}
                  {(article.draftCount ?? 0) > 0 && (
                    <span className="rounded-md bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      {article.draftCount} drafts
                    </span>
                  )}
                </div>

                <h3 className="flex-1 text-sm font-semibold text-white/40 leading-snug line-clamp-3">
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
                       <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#e99ab1] bg-[#e99ab1]/10 rounded-full px-2 py-0.5">
                        <ArrowUpRight className="h-2.5 w-2.5" />
                        View Drafts
                      </span>
                    ) : (article.angleCount ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-300 bg-zinc-800 rounded-full px-2 py-0.5">
                        <RotateCcw className="h-2.5 w-2.5" />
                        Load Angles
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-300 bg-zinc-800 rounded-full px-2 py-0.5">
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
