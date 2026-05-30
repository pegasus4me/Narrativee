"use client";

import { useState, Suspense } from "react";
import { authClient } from "../../../lib/auth-client";
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
import { useChannels, useDeleteChannel, useConnectBluesky } from "@/app/hooks/api/useChannels";
import { useSources, useAddSource, useDeleteSource } from "@/app/hooks/api/useSources";
import { MOCK_CHANNELS, MOCK_SOURCES } from "@/app/components/workspace/shared/mockData";
import { ConnectionsList } from "@/app/components/workspace/channels/ConnectionsList";
import { AddSourceForm } from "@/app/components/workspace/channels/AddSourceForm";
import { BlueskyModal } from "@/app/components/workspace/channels/BlueskyModal";
import { InstagramModal } from "@/app/components/workspace/channels/InstagramModal";
import type { Channel, Source } from "@/app/types/api";
import { LINKEDIN_LOGO, X_LOGO, INSTAGRAM_LOGO, FACEBOOK_LOGO, THREADS_LOGO, BLUESKY_LOGO } from "@/app/constants";

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  linkedin: {
    label: "LinkedIn",
    icon: <img src={LINKEDIN_LOGO} alt="LinkedIn" className="h-5 w-5 object-contain" />,
    color: "text-[#0A66C2]",
    bg: "bg-[#0A66C2]/10 border-[#0A66C2]/20",
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

  const session = authClient.useSession();
  const isGuest = !session.isPending && !session.data?.user;
  const isLoggedIn = !session.isPending && !!session.data?.user;

  const { data: channelsData, isLoading: channelsLoading } = useChannels(isLoggedIn);
  const { data: sourcesData, isLoading: sourcesLoading } = useSources(isLoggedIn);
  const deleteChannel = useDeleteChannel();
  const deleteSource = useDeleteSource();
  const addSource = useAddSource();
  const connectBluesky = useConnectBluesky();

  const channels: Channel[] = isLoggedIn ? (channelsData ?? []) : MOCK_CHANNELS;
  const sources: Source[] = isLoggedIn ? (sourcesData ?? []) : MOCK_SOURCES;
  const loading = isLoggedIn ? (channelsLoading || sourcesLoading) : false;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [blueskyError, setBlueskyError] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [sourceSuccess, setSourceSuccess] = useState("");

  const connectedPlatforms = new Set(channels.map((c) => c.platform));
  const hasConnections = channels.length > 0 || sources.length > 0;

  const handleConnect = (platform: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
    if (platform === "bluesky") { setBlueskyError(""); setShowBlueskyModal(true); return; }
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

  const handleDisconnectChannel = async (channelId: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
    if (!confirm("Are you sure you want to disconnect this channel?")) return;
    deleteChannel.mutate(channelId);
  };

  const handleDisconnectSource = async (sourceId: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
    if (!confirm("Are you sure you want to disconnect this newsletter?")) return;
    deleteSource.mutate(sourceId);
  };

  const handleAddSource = async (url: string, platform: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
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
                <Link href="/workspace/create/new" className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline">Open Create</Link>{" "}
                to pull angles from any synced articles.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center">
              <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900">Unlock Channel Connections</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                You&apos;re currently exploring in <strong className="text-indigo-600 font-bold">Sandbox Mode</strong>. Connect your own channels to start repurposing.
              </p>
            </div>
            <ul className="mt-6 space-y-3.5 border-t border-zinc-100/50 pt-6">
              {["Publish automatically with one-click dispatch", "Fully customizable tone of voice models", "Direct API channels: X, LinkedIn, Threads, Instagram", "Seamless custom RSS and Substack syncing"].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-zinc-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/auth/signup" className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 text-sm">Create Free Account</Link>
              <Link href="/auth/signin" className="flex h-12 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white font-bold text-zinc-700 transition-all hover:bg-zinc-50 text-sm">Sign In</Link>
              <button type="button" onClick={() => setShowAuthModal(false)} className="mt-1 text-xs text-zinc-400 font-medium hover:text-zinc-600 transition-colors">Continue Exploring</button>
            </div>
          </div>
        </div>
      )}

      <BlueskyModal
        isOpen={showBlueskyModal}
        onClose={() => setShowBlueskyModal(false)}
        onConnect={handleConnectBluesky}
        isConnecting={connectBluesky.isPending}
        error={blueskyError}
      />

      <InstagramModal isOpen={showInstagramModal} onClose={() => setShowInstagramModal(false)} />
    </div>
  );
}

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
