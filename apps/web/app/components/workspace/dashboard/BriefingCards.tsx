"use client";

import Link from "next/link";
import type { Channel, Source, Draft } from "@/app/types/api";
import { getPlatformLogo } from "../shared/PlatformLogo";

interface BriefingCardsProps {
  sources: Source[];
  channels: Channel[];
  scheduledCount: number;
  publishedCount: number;
}

export function BriefingCards({ sources, channels, scheduledCount, publishedCount }: BriefingCardsProps) {
  return (
    <div>
      <h2 className="mb-4 text-md text-black">Workspace Activity Briefing</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <SourcesCard sources={sources} />
        <ChannelsCard channels={channels} />
        <ScheduledCard count={scheduledCount} />
        <PublishedCard count={publishedCount} />
      </div>
    </div>
  );
}

function SourcesCard({ sources }: { sources: Source[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
      <div>
        <span className="text-[10px] font-bold text-zinc-400 block">Content Sources</span>
        <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{sources.length}</strong>
        <div className="mt-2 text-xs text-zinc-500 font-medium">
          {sources.length > 0 ? (
            <span className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Substack publications synced
            </span>
          ) : (
            <span className="text-zinc-400">No newsletters connected yet</span>
          )}
        </div>
      </div>
      {sources.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-zinc-50">
          {sources.map((s, idx) => (
            <span key={s.id || idx} className="inline-flex items-center gap-1 rounded-md bg-orange-50 border border-orange-100 text-orange-700 text-[9px] font-semibold px-2 py-0.5">
              {s.url ? s.url.replace("https://", "").replace("/feed", "") : "Substack Newsletter"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelsCard({ channels }: { channels: Channel[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
      <div>
        <span className="text-[10px] font-bold text-zinc-400 block">Connected Channels</span>
        <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{channels.length}</strong>
        <div className="mt-2 text-xs text-zinc-500 font-medium">
          {channels.length > 0 ? (
            <span className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
              Active social connection pipelines
            </span>
          ) : (
            <span className="text-zinc-400">No destination channels connected</span>
          )}
        </div>
      </div>
      {channels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-50">
          {channels.map((c, idx) => (
            <div
              key={c.id || idx}
              title={`${c.platform?.toUpperCase()}: ${c.accountName || ""}`}
              className="relative h-6 w-6 rounded-md overflow-hidden bg-zinc-50 border border-zinc-200/80 flex items-center justify-center p-1 shrink-0 shadow-2xs hover:scale-110 transition-all cursor-default"
            >
              <img src={getPlatformLogo(c.platform)} alt={c.platform} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduledCard({ count }: { count: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
      <div>
        <span className="text-[10px] font-bold text-zinc-400 block">Scheduled Posts</span>
        <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{count}</strong>
        <div className="mt-2 text-xs text-zinc-500 font-medium">
          {count > 0 ? (
            <span className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              Social updates pending dispatch
            </span>
          ) : (
            <span className="text-zinc-400">Queue is currently empty</span>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-50 text-[10px] text-zinc-400 font-medium flex items-center justify-between">
        <span>Next publish pending</span>
        <Link href="/workspace/post-queue" className="text-indigo-600 hover:text-indigo-700 font-bold">
          View Queue
        </Link>
      </div>
    </div>
  );
}

function PublishedCard({ count }: { count: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
      <div>
        <span className="text-[10px] font-bold text-zinc-400 block">Published Posts</span>
        <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{count}</strong>
        <div className="mt-2 text-xs text-zinc-500 font-medium">
          {count > 0 ? (
            <span className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Repurposed updates successfully sent
            </span>
          ) : (
            <span className="text-zinc-400">No posts published yet</span>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-50 text-[10px] text-zinc-400 font-medium flex items-center justify-between">
        <span>Lifetime publications</span>
        <span className="text-emerald-600 font-bold">Active</span>
      </div>
    </div>
  );
}
