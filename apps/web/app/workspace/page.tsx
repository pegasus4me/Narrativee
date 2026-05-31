"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarDays,
  Sparkles,
  Brain,
  Loader2,
  ArrowRight,
  Layers,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Plus,
  Link2,
  Activity,
  Rss,
  RssIcon,
  ChevronLeft,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  useChannels,
  useCreationSessions,
  useDraftsQueue,
  useArticles,
  useCredits,
  useKnowledgeBase,
} from "@/app/hooks/api";
import {
  LINKEDIN_LOGO,
  X_LOGO,
  THREADS_LOGO,
  FACEBOOK_LOGO,
  INSTAGRAM_LOGO,
} from "@/app/constants";

const PLATFORM_LOGOS: Record<string, string> = {
  linkedin: LINKEDIN_LOGO,
  x: X_LOGO,
  twitter: X_LOGO,
  threads: THREADS_LOGO,
  facebook: FACEBOOK_LOGO,
  instagram: INSTAGRAM_LOGO,
};

function getPlatformLogo(platform: string): string | null {
  return PLATFORM_LOGOS[platform.toLowerCase()] ?? null;
}

function formatFriendlyTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function WorkspaceDashboard() {
  const session = authClient.useSession();
  const user = session.data?.user;
  const isAuthenticated = !!user;

  // Query database metrics using hooks
  const { data: channels, isLoading: loadingChannels } = useChannels(isAuthenticated);
  const { data: creations, isLoading: loadingCreations } = useCreationSessions(isAuthenticated);
  const { data: queue, isLoading: loadingQueue } = useDraftsQueue(isAuthenticated);
  const { data: articles, isLoading: loadingArticles } = useArticles(isAuthenticated);
  const { data: credits, isLoading: loadingCredits } = useCredits(isAuthenticated);
  const { data: kb, isLoading: loadingKB } = useKnowledgeBase(isAuthenticated);

  const activeChannels = channels ?? [];
  const savedCreations = creations ?? [];
  const scheduledPosts = useMemo(
    () => (queue ?? []).filter((p) => p.status === "scheduled" && p.scheduledAt),
    [queue]
  );
  const recentArticles = articles ?? [];
  const creditBalance = credits ?? 0;
  const maxCredits = 1000; // Visual denominator for progress bar

  const isMainLoading =
    session.isPending ||
    loadingChannels ||
    loadingCreations ||
    loadingQueue ||
    loadingArticles ||
    loadingCredits ||
    loadingKB;

  if (isMainLoading) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          Synchronizing mission control...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[90%] space-y-8 px-6 py-10 antialiased">
      {/* ─── Hero Welcome Banner ─── */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-violet-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              <Zap className="h-3 w-3" />
              Social Repurposing Pipeline Live
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
              Welcome back, <span className="bg-gradient-to-r from-indigo-300 to-violet-200 bg-clip-text text-transparent">{user?.name || "Creator"}</span>
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Narrativee helps you translate your deep-dive newsletter issues into high-performing, native-channel social campaigns. Monitor your queues and launch packs below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/workspace/create/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 text-xs font-semibold tracking-wide shadow-lg shadow-indigo-600/10 transition-all duration-200 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Generate Social Pack
            </Link>
            <Link
              href="/workspace/memory"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-200 px-5 py-3 text-xs font-semibold tracking-wide transition-all duration-200"
            >
              <Brain className="h-4 w-4" />
              Voice Memory
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Metrics Grid ─── */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric: Scheduled Queue */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-950/60 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Queue</span>
            <div className="rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20 text-indigo-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-zinc-100 block">{scheduledPosts.length} posts</span>
            <Link href="/workspace/calendar" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mt-1.5">
              Open Calendar
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric: Connected Channels */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-950/60 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Social Channels</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20 text-emerald-400">
              <Link2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-zinc-100 block">{activeChannels.length} profiles</span>
            <Link href="/workspace/channels" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors mt-1.5">
              Manage Profiles
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric: Brand Voice Memory */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-950/60 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Voice Memory</span>
            <div className="rounded-lg bg-violet-500/10 p-2 border border-violet-500/20 text-violet-400">
              <Brain className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold text-zinc-100 block">
              {kb?.brandVoiceTraining ? "Dynamic Profile Configured" : "Awaiting Training"}
            </span>
            <Link href="/workspace/memory" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors mt-1.5">
              {kb?.brandVoiceTraining ? "Analyze Voice profile" : "Train Voice Profile"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric: Credit Balance */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-950/60 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Credits Available</span>
            <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold text-zinc-100">{creditBalance}</span>
              <span className="text-[10px] text-zinc-500">of {maxCredits}</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (creditBalance / maxCredits) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Creations Horizontal Scroller ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Creations Library</h2>
            <p className="text-xs text-zinc-500 mt-1">Select previously saved channel pack iterations</p>
          </div>
          <Link href="/workspace/create" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            View All Packs
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </Link>
        </div>

        {savedCreations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 py-12 text-center">
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No saved packs generated yet. Import your first issue and translate it to connect to social templates!
            </p>
            <Link href="/workspace/create/new" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mt-3 font-semibold">
              Create a Draft Pack
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedCreations.slice(0, 3).map((creation) => (
              <article
                key={creation.id}
                className="group relative rounded-2xl border border-white/5 bg-zinc-950/40 p-5 backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-950/60 flex flex-col justify-between min-h-[170px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-semibold text-indigo-300">
                      {creation.draftCountPerChannel} drafts per channel
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(creation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white line-clamp-2 leading-snug">
                    {creation.articleTitle || "Untitled creation"}
                  </h3>
                </div>

                <div className="mt-5 border-t border-white/5 pt-4 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">
                    {creation.draftCount} drafts generated
                  </span>
                  <Link
                    href={`/workspace/create/${creation.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Open Pack
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ─── Bottom Columns: Queue Preview & Ready newsletters ─── */}
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Left Column: Scheduled Timeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Weekly Queue Feed</h2>
              <p className="text-xs text-zinc-500 mt-1">Live overview of upcoming publishing slots</p>
            </div>
            <Link href="/workspace/calendar" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              View Calendar
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 py-16 text-center">
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Your post-dispatch queue is empty. Choose a channel card variations pack and schedule your releases!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {scheduledPosts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-950/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="relative h-8 w-8 shrink-0">
                      {post.channel?.avatarUrl ? (
                        <img
                          src={post.channel.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border border-zinc-800"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-800">
                          {(post.channel?.accountName || post.channel?.platform || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      {post.channel?.platform && getPlatformLogo(post.channel.platform) ? (
                        <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-zinc-950 p-0.5 border border-zinc-800">
                          <img
                            src={getPlatformLogo(post.channel.platform) ?? ""}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">
                          {post.channel?.accountName || "Connected profile"}
                        </span>
                        <span className="text-[10px] text-zinc-500 bg-white/[0.02] px-2 py-0.5 rounded-full border border-white/5 capitalize">
                          {post.channel?.platform}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300/80 truncate max-w-xl font-normal pr-4">
                        {post.content?.text || ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-start">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-400 block">
                        {new Date(post.scheduledAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">
                        {formatFriendlyTime(post.scheduledAt!)}
                      </span>
                    </div>
                    <Link
                      href="/workspace/calendar"
                      className="rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Ready Newsletter Issues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100 font-urbanist">Import Pipeline</h2>
              <p className="text-xs text-zinc-500 mt-1">Ready issues for packing</p>
            </div>
            <Link href="/workspace/create/new" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5">
              Import
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentArticles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 p-8 text-center">
              <RssIcon className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-[11px] text-zinc-600 leading-normal max-w-[160px] mx-auto">
                No articles imported. Feed your newsletter RSS link to fetch!
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {recentArticles.slice(0, 4).map((art) => (
                <div
                  key={art.id}
                  className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 transition-all hover:border-white/10 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1 leading-normal">
                      {art.title}
                    </h4>
                    <span className="text-[9px] text-zinc-500 block">
                      Imported {new Date(art.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <Link
                    href={`/workspace/create/new?articleId=${art.id}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors w-fit"
                  >
                    Launch Pack
                    <ArrowRight className="h-3 w-3 shrink-0" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
