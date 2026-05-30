"use client";

import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { Channel } from "@/app/types/api";
import {
  BLUESKY_LOGO,
  FACEBOOK_LOGO,
  INSTAGRAM_LOGO,
  LINKEDIN_LOGO,
  THREADS_LOGO,
  X_LOGO,
} from "@/app/constants";

interface SocialChannelSelectorProps {
  channels: Channel[];
  selectedChannelIds: Set<string>;
  requestedDraftCount: number;
  isPreparingNativeTone: boolean;
  onToggleChannel: (channelId: string) => void;
  onDraftCountChange: (requestedDraftCount: number) => void;
  onContinue: () => void;
}

const DRAFT_COUNT_OPTIONS = [1, 2, 3, 4] as const;

const PLATFORM_LOGOS: Record<string, string> = {
  linkedin: LINKEDIN_LOGO,
  x: X_LOGO,
  twitter: X_LOGO,
  instagram: INSTAGRAM_LOGO,
  threads: THREADS_LOGO,
  facebook: FACEBOOK_LOGO,
  bluesky: BLUESKY_LOGO,
};

/**
 * Step four selector for choosing destination socials before channel-native compilation.
 */
export function SocialChannelSelector({
  channels,
  selectedChannelIds,
  requestedDraftCount,
  isPreparingNativeTone,
  onToggleChannel,
  onDraftCountChange,
  onContinue,
}: SocialChannelSelectorProps) {
  if (channels.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm text-zinc-400">
        Connect at least one social channel to generate native drafts.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Draft variants</p>
        <p className="mt-2 text-sm text-zinc-400">
          Choose how many draft variations Narrativee should generate for each selected social.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {DRAFT_COUNT_OPTIONS.map((draftCountOption) => {
            const isSelected = requestedDraftCount === draftCountOption;

            return (
              <button
                key={draftCountOption}
                type="button"
                onClick={() => onDraftCountChange(draftCountOption)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  isSelected
                    ? "border-zinc-100 bg-zinc-800 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {draftCountOption} {draftCountOption === 1 ? "draft" : "drafts"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {channels.map((channel) => {
          const platform = channel.platform.toLowerCase();
          const logoSrc = PLATFORM_LOGOS[platform];
          const isSelected = selectedChannelIds.has(channel.id);

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onToggleChannel(channel.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-zinc-100 bg-zinc-800 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {logoSrc ? (
                    <Image
                      src={logoSrc}
                      alt={channel.platform}
                      width={20}
                      height={20}
                      unoptimized
                      className="h-5 w-5 rounded-full object-contain"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold uppercase">
                      {channel.platform.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{channel.accountName}</p>
                    <p className="text-xs capitalize text-zinc-500">{channel.platform}</p>
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={selectedChannelIds.size === 0 || isPreparingNativeTone}
        onClick={onContinue}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        Learn native tone
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
