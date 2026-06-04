"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api-config";
import {
  Link2,
  Instagram,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useChannels, useDeleteChannel, useConnectBluesky, useConnectSubstack } from "@/app/hooks/api/useChannels";
import { useSources, useAddSource, useDeleteSource } from "@/app/hooks/api/useSources";
import { ConnectionsList } from "@/app/components/workspace/channels/ConnectionsList";
import { AddSourceForm } from "@/app/components/workspace/channels/AddSourceForm";
import { BlueskyModal } from "@/app/components/workspace/channels/BlueskyModal";
import { InstagramModal } from "@/app/components/workspace/channels/InstagramModal";
import { SubstackModal } from "@/app/components/workspace/channels/SubstackModal";
import type { Channel, Source } from "@/app/types/api";
import { LINKEDIN_LOGO, X_LOGO, INSTAGRAM_LOGO, FACEBOOK_LOGO, THREADS_LOGO, BLUESKY_LOGO, SUBSTACK_LOGO } from "@/app/constants";

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  linkedin: {
    label: "LinkedIn",
    icon: <img src={LINKEDIN_LOGO} alt="LinkedIn" className="h-5 w-5 object-contain" />,
    color: "text-[#0A66C2]",
    bg: "bg-[#0A66C2]/10 border-[#0A66C2]/20",
  },
  x: {
    label: "X (Twitter)",
    icon: <img src={X_LOGO} alt="X" className="h-5 w-5 object-contain invert" />,
    color: "text-white",
    bg: "bg-zinc-900 border border-zinc-800",
  },
  bluesky: {
    label: "Bluesky",
    icon: <img src={BLUESKY_LOGO} alt="Bluesky" className="h-5 w-5 object-contain" />,
    color: "text-[#1877F2]",
    bg: "bg-[#1877F2]/10 border-[#1877F2]/20",
  },
  instagram: {
    label: "Instagram",
    icon: <img src={INSTAGRAM_LOGO} alt="Instagram" className="h-5 w-5 object-contain" />,
    color: "text-[#E1306C]",
    bg: "bg-[#E1306C]/10 border-[#E1306C]/20",
  },
  facebook: {
    label: "Facebook",
    icon: <img src={FACEBOOK_LOGO} alt="Facebook" className="h-5 w-5 object-contain" />,
    color: "text-[#1877F2]",
    bg: "bg-[#1877F2]/10 border-[#1877F2]/20",
  },
  threads: {
    label: "Threads",
    icon: <img src={THREADS_LOGO} alt="Threads" className="h-5 w-5 object-contain invert" />,
    color: "text-white",
    bg: "bg-zinc-900 border border-zinc-800",
  },
  substack: {
    label: "Substack notes",
    icon: <img src={SUBSTACK_LOGO} alt="Substack" className="h-5 w-5 object-contain" />,
    color: "text-[#FF581E]",
    bg: "bg-[#FF581E]/10 border-[#FF581E]/20",
  },
};

const AFTER_CONNECT = [
  { title: "Issues land in Create", body: "Synced posts show up as pickable issues\u2014no copy-paste from your inbox." },
  { title: "Social accounts = destinations", body: "When drafts ship, they'll post through these connections with native formatting." },
  { title: "Re-sync anytime", body: "Submit your Substack URL again to pull new editions into the same pipeline." },
] as const;

function ChannelsPageContent() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");
  const detail = searchParams.get("detail");

  const { data: channelsData, isLoading: channelsLoading } = useChannels(true);
  const { data: sourcesData, isLoading: sourcesLoading } = useSources(true);
  const deleteChannel = useDeleteChannel();
  const deleteSource = useDeleteSource();
  const addSource = useAddSource();
  const connectBluesky = useConnectBluesky();
  const connectSubstack = useConnectSubstack();

  const channels: Channel[] = channelsData ?? [];
  const sources: Source[] = sourcesData ?? [];
  const loading = channelsLoading || sourcesLoading;

  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showSubstackModal, setShowSubstackModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [blueskyError, setBlueskyError] = useState("");
  const [substackError, setSubstackError] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [sourceSuccess, setSourceSuccess] = useState("");

  const connectedPlatforms = new Set(channels.map((c) => c.platform));
  const hasConnections = channels.length > 0 || sources.length > 0;

  const handleConnect = (platform: string) => {
    if (platform === "bluesky") { setBlueskyError(""); setShowBlueskyModal(true); return; }
    if (platform === "substack") { setSubstackError(""); setShowSubstackModal(true); return; }
    if (platform === "instagram") { setShowInstagramModal(true); return; }
    window.location.href = `${API_URL}/channels/connect/${platform}`;
  };

  const handleConnectBluesky = async (params: { identifier: string; appPassword: string }) => {
    try {
      setBlueskyError("");
      await connectBluesky.mutateAsync(params);
      setShowBlueskyModal(false);
    } catch (err: unknown) {
      setBlueskyError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  const handleConnectSubstack = async (params: { identifier: string; sessionCookie: string }) => {
    try {
      setSubstackError("");
      await connectSubstack.mutateAsync(params);
      setShowSubstackModal(false);
    } catch (err: unknown) {
      setSubstackError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  const handleDisconnectChannel = async (channelId: string) => {
    if (!confirm("Are you sure you want to disconnect this channel?")) return;
    deleteChannel.mutate(channelId);
  };

  const handleDisconnectSource = async (sourceId: string) => {
    if (!confirm("Are you sure you want to disconnect this newsletter?")) return;
    deleteSource.mutate(sourceId);
  };

  const handleAddSource = async (url: string, platform: string) => {
    setSourceError("");
    setSourceSuccess("");
    try {
      await addSource.mutateAsync({ url, platform });
      setSourceSuccess("Source connected successfully!");
    } catch (err: unknown) {
      setSourceError(err instanceof Error ? err.message : "Failed to add source");
    }
  };

  return (
    <div className="mx-auto w-[90%] space-y-6 py-8">
      <header className="mb-10 flex flex-col gap-6 pb-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl lg:max-w-none lg:flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Connect</h1>
        </div>

      </header>

      <div className="w-full min-w-0">
        <section className="min-w-0 space-y-8">
          {connected && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span><strong className="capitalize">{connected}</strong> connected successfully.</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="font-medium">Connection failed:</span> {error}
                {detail && <p className="mt-1 text-xs text-red-600">{decodeURIComponent(detail)}</p>}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-3 py-16 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading connections...</span>
            </div>
          ) : (
            <ConnectionsList
              channels={channels}
              sources={sources}
              platformMeta={PLATFORM_META}
              onDisconnectChannel={handleDisconnectChannel}
              onDisconnectSource={handleDisconnectSource}
            />
          )}

          <div className="mt-10">
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Add destinations</h2>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Object.entries(PLATFORM_META).map(([platform, meta]) => {
                const isConnected = connectedPlatforms.has(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => !isConnected && handleConnect(platform)}
                    disabled={isConnected}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-medium transition-colors ${isConnected
                      ? "cursor-default bg-zinc-900/40 text-zinc-600 border border-zinc-800/40"
                      : "bg-zinc-900/80 text-zinc-200 border border-zinc-800 hover:bg-zinc-800/60 hover:text-white"
                      }`}
                  >
                    <div className={isConnected ? "text-zinc-700" : meta.color}>{meta.icon}</div>
                    <span>{meta.label}</span>
                    {isConnected ? (
                      <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Plus className="ml-auto h-4 w-4 shrink-0 text-zinc-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <AddSourceForm
              onSubmit={handleAddSource}
              isSubmitting={addSource.isPending}
              error={sourceError}
              success={sourceSuccess}
            />
          </div>

          {hasConnections && (
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 px-5 py-4">
              <p className="text-sm text-zinc-400">
                <strong className="font-medium text-zinc-200">Next:</strong>{" "}
                <Link href="/workspace/create/new" className="font-medium text-[#e99ab1] hover:text-[#e99ab1]/80 underline-offset-4 hover:underline">Open Create</Link>{" "}
                to pull angles from any synced articles.
              </p>
            </div>
          )}
        </section>
      </div>

      <BlueskyModal
        isOpen={showBlueskyModal}
        onClose={() => setShowBlueskyModal(false)}
        onConnect={handleConnectBluesky}
        isConnecting={connectBluesky.isPending}
        error={blueskyError}
      />

      <SubstackModal
        isOpen={showSubstackModal}
        onClose={() => setShowSubstackModal(false)}
        onConnect={handleConnectSubstack}
        isConnecting={connectSubstack.isPending}
        error={substackError}
      />

      <InstagramModal isOpen={showInstagramModal} onClose={() => setShowInstagramModal(false)} />
    </div>
  );
}

/** Displays authenticated newsletter sources and social channel connections. */
export default function ChannelsPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14 flex items-center justify-center py-24 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm ml-2">Loading connections...</span>
      </div>
    }>
      <ChannelsPageContent />
    </Suspense>
  );
}
