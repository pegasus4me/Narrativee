"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Loader2, Sparkles } from "lucide-react";
import { useCreationSessions } from "@/app/hooks/api";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Recently updated";
  }

  return DATE_FORMATTER.format(parsedDate);
}

/**
 * Create library page showing previously generated draft packs.
 */
export default function CreateLibraryPage() {
  const { data: creations, isLoading, error } = useCreationSessions(true);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Create</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-100 md:text-4xl">
            Your saved draft packs
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">
            Re-open previous creations, refine saved variants, or start a new repurposing workflow.
          </p>
        </div>

        <Link
          href="/workspace/create/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          <Sparkles className="h-4 w-4" />
          New creation
        </Link>
      </header>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            Loading saved creations...
          </div>
        </div>
      ) : error instanceof Error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm font-medium text-red-200">Unable to load your creations</p>
          <p className="mt-1 text-xs text-red-300/80">{error.message}</p>
        </div>
      ) : creations && creations.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {creations.map((creation) => (
            <Link
              key={creation.id}
              href={`/workspace/create/${creation.id}`}
              className="group rounded-3xl border border-white/10 bg-zinc-950/60 p-5 transition-colors hover:border-white/20 hover:bg-zinc-900/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-zinc-100">
                    {creation.articleTitle}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(creation.updatedAt)}
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">
                      {creation.draftCount} drafts
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">
                      {creation.draftCountPerChannel} per channel
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-200" />
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Source</p>
                <p className="line-clamp-1 text-sm text-zinc-300">
                  {creation.sourceUrl
                    ? creation.sourceUrl.replace("https://", "").replace("/feed", "")
                    : "Saved creation"}
                </p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/40 p-10 text-center">
          <p className="text-lg font-medium text-zinc-100">No saved draft packs yet</p>
          <p className="mt-2 text-sm text-zinc-400">
            Start a new creation workflow to generate your first saved set of platform-native drafts.
          </p>
          <Link
            href="/workspace/create/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            <Sparkles className="h-4 w-4" />
            Start creating
          </Link>
        </div>
      )}
    </div>
  );
}
