"use client";

import { Link2, Rss, RefreshCw } from "lucide-react";
import type { Channel, Source } from "@/app/types/api";

interface PlatformMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

interface ConnectionsListProps {
  channels: Channel[];
  sources: Source[];
  platformMeta: Record<string, PlatformMeta>;
  onDisconnectChannel: (id: string) => void;
  onDisconnectSource: (id: string) => void;
}

export function ConnectionsList({
  channels,
  sources,
  platformMeta,
  onDisconnectChannel,
  onDisconnectSource,
}: ConnectionsListProps) {
  const hasConnections = channels.length > 0 || sources.length > 0;

  if (!hasConnections) {
    return (
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 px-8 py-14 text-center text-zinc-400">
        <Link2 className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
        <p>No connections yet. Add a destination or Substack below.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-zinc-100">Your connections</h2>
      <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
        {channels.map((channel) => {
          const meta = platformMeta[channel.platform];
          return (
            <li
              key={channel.id}
              className="flex min-h-[5.5rem] flex-col justify-between rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 transition-colors hover:bg-zinc-800/40 hover:border-zinc-700/60"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 shrink-0">
                  {channel.avatarUrl ? (
                    <img src={channel.avatarUrl} alt={channel.accountName} className="h-11 w-11 rounded-full object-cover border border-zinc-800" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/60 text-sm font-semibold text-zinc-300">
                      {(channel.accountName || meta?.label || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 p-0.5 border border-zinc-800 [&>img]:h-3.5 [&>img]:w-3.5 [&>svg]:h-3.5 [&>svg]:w-3.5">
                    {meta?.icon}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{channel.accountName || meta?.label}</p>
                  <p className="text-xs capitalize text-zinc-500">{channel.platform}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDisconnectChannel(channel.id)}
                className="mt-3 self-end text-xs text-zinc-400 transition-colors hover:text-red-500"
              >
                Disconnect
              </button>
            </li>
          );
        })}

        {sources.map((source) => {
          const favicon = (() => {
            try {
              const url = new URL(source.url);
              return `${url.protocol}//${url.hostname}/favicon.ico`;
            } catch {
              return null;
            }
          })();
          const imgUrl = source.avatarUrl || favicon;

          return (
            <li
              key={source.id}
              className="flex min-h-[5.5rem] flex-col justify-between rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 transition-colors hover:bg-zinc-800/40 hover:border-zinc-700/60"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 shrink-0">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover border border-zinc-800"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const el = document.getElementById(`ch-fallback-${source.id}`);
                        el?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    id={`ch-fallback-${source.id}`}
                    className={`flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 text-orange-500 ${imgUrl ? "hidden" : ""}`}
                  >
                    <Rss className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 p-1 border border-zinc-800">
                    {source.platform === "custom_rss" ? (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-orange-500 text-white p-0.5">
                        <Rss className="h-2.5 w-2.5 stroke-[2.5]" />
                      </div>
                    ) : (
                      <img src="https://cdn.worldvectorlogo.com/logos/substack-1.svg" alt="" className="h-full w-full object-contain" />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-200 hover:text-white hover:underline">
                    {source.url.replace("https://", "").replace("/feed", "")}
                  </a>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>{source.articleCount || 0} articles</span>
                    {source.lastSyncedAt && (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <RefreshCw className="h-3 w-3" />
                        {new Date(source.lastSyncedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDisconnectSource(source.id)}
                className="mt-3 self-end text-xs text-zinc-400 transition-colors hover:text-red-500"
              >
                Disconnect
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
