"use client";

import { useEffect, useState, Suspense } from "react";
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
  RefreshCw,
  ChevronRight,
  Rss,
  Plug,
} from "lucide-react";

interface Channel {
  id: string;
  platform: string;
  accountName: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Source {
  id: string;
  platform: string;
  url: string;
  articleCount?: number;
  lastSyncedAt?: string;
  avatarUrl?: string;
}

import { LINKEDIN_LOGO, X_LOGO, INSTAGRAM_LOGO, FACEBOOK_LOGO, THREADS_LOGO, BLUESKY_LOGO } from "@/app/constants";

const PLATFORM_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  linkedin: {
    label: "LinkedIn",
    icon: (
      <img
        src={LINKEDIN_LOGO}
        alt="LinkedIn"
        className="h-5 w-5 object-contain"
      />
    ),
    color: "text-[#0A66C2]",
    bg: "bg-[#0A66C2]/10 border-[#0A66C2]/20",
  },
  /**
   *   x: {
    label: "X (Twitter)",
    icon: (
      <img
        src={X_LOGO}
        alt="X (Twitter)"
        className="h-5 w-5 object-contain mix-blend-multiply"
      />
    ),
    color: "text-black",
    bg: "bg-black/5 border-black/10",
  },
  
   */
  bluesky: {
    label: "Bluesky",
    icon: (
      <img
        src={BLUESKY_LOGO}
        alt="Bluesky"
        className="h-5 w-5 object-contain"
      />
    ),
    color: "text-[#1877F2]",
    bg: "bg-[#1877F2]/10 border-[#1877F2]/20",
  },
  instagram: {
    label: "Instagram",
    icon: (
      <img
        src={INSTAGRAM_LOGO}
        alt="Instagram"
        className="h-5 w-5 object-contain"
      />
    ),
    color: "text-[#E1306C]",
    bg: "bg-[#E1306C]/10 border-[#E1306C]/20",
  },
  facebook: {
    label: "Facebook",
    icon: (
      <img
        src={FACEBOOK_LOGO}
        alt="Facebook"
        className="h-5 w-5 object-contain"
      />
    ),
    color: "text-[#1877F2]",
    bg: "bg-[#1877F2]/10 border-[#1877F2]/20",
  },
  threads: {
    label: "Threads",
    icon: (
      <img
        src={THREADS_LOGO}
        alt="Threads"
        className="h-5 w-5 object-contain"
      />
    ),
    color: "text-black",
    bg: "bg-zinc-950/5 border-zinc-950/10",
  },
};

const AFTER_CONNECT = [
  {
    title: "Issues land in Create",
    body: "Synced posts show up as pickable issues—no copy-paste from your inbox.",
  },
  {
    title: "Social accounts = destinations",
    body: "When drafts ship, they’ll post through these connections with native formatting.",
  },
  {
    title: "Re-sync anytime",
    body: "Submit your Substack URL again to pull new editions into the same pipeline.",
  },
] as const;

function ChannelsPageContent() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");
  const detail = searchParams.get("detail");

  const session = authClient.useSession();
  const isGuest = !session.isPending && !session.data?.user;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const [urlInput, setUrlInput] = useState("");
  const [isSubmittingSubstack, setIsSubmittingSubstack] = useState(false);
  const [substackError, setSubstackError] = useState("");
  const [substackSuccess, setSubstackSuccess] = useState("");
  const [syncTab, setSyncTab] = useState<"substack" | "custom_rss">("substack");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    if (isGuest) {
      setChannels([
        {
          id: "mock-channel-1",
          platform: "linkedin",
          accountName: "Sarah Chen (Founder)",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg",
          createdAt: new Date().toISOString()
        },
        {
          id: "mock-channel-2",
          platform: "x",
          accountName: "sarah_growth",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg",
          createdAt: new Date().toISOString()
        },
        {
          id: "mock-channel-3",
          platform: "threads",
          accountName: "sarah_chen",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg",
          createdAt: new Date().toISOString()
        },
        {
          id: "mock-channel-4",
          platform: "instagram",
          accountName: "sarah_insta",
          avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg",
          createdAt: new Date().toISOString()
        }
      ]);
      setSources([
        {
          id: "mock-source-1",
          platform: "substack",
          url: "https://creators.substack.com/feed",
          articleCount: 12,
          lastSyncedAt: new Date().toISOString(),
          avatarUrl: undefined
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const [channelsRes, sourcesRes] = await Promise.all([
        fetch(`${API_URL}/channels`, { credentials: "include" }),
        fetch(`${API_URL}/sources`, { credentials: "include" }),
      ]);

      const channelsData = (await channelsRes.json()) as { channels?: Channel[] };
      console.log(channelsData);
      const sourcesData = (await sourcesRes.json()) as { sources?: Source[] };

      setChannels(channelsData.channels || []);
      setSources(sourcesData.sources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.isPending) return;
    fetchData();
  }, [session.isPending, isGuest]);

  const handleConnect = (platform: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    window.location.href = `${API_URL}/channels/connect/${platform}`;
  };

  const handleDisconnectChannel = async (channelId: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    if (!confirm("Are you sure you want to disconnect this channel?")) return;
    await fetch(`${API_URL}/channels/${channelId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
  };

  const handleDisconnectSource = async (sourceId: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    if (!confirm("Are you sure you want to disconnect this newsletter?")) return;
    await fetch(`${API_URL}/sources/${sourceId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  const handleAddSubstack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    if (isGuest) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmittingSubstack(true);
    setSubstackError("");
    setSubstackSuccess("");

    try {
      const res = await fetch(`${API_URL}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platform: syncTab, url: urlInput }),
      });

      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to add Substack");
      }

      setSubstackSuccess(data.message || "Substack connected successfully!");
      setUrlInput("");
      fetchData();
    } catch (err: any) {
      setSubstackError(err.message);
    } finally {
      setIsSubmittingSubstack(false);
    }
  };

  const connectedPlatforms = new Set(channels.map((c) => c.platform));
  const hasConnections = channels.length > 0 || sources.length > 0;

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      <header className="mb-10 flex flex-col gap-6 border-b border-zinc-100 pb-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl lg:max-w-none lg:flex-1">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Connect
            </h1>
          </div>
        </div>

        <nav
          className="flex shrink-0 flex-wrap gap-1 rounded-xl bg-zinc-100/90 p-1 text-xs font-medium text-zinc-500"
          aria-label="Repurpose steps"
        >
          <span className="rounded-lg bg-white px-3 py-2 text-zinc-900">
            Connect
          </span>
          <Link
            href="/workspace/create"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-white/80 hover:text-zinc-800"
          >
            Angles
          </Link>
          <span className="rounded-lg px-3 py-2 opacity-50">Drafts</span>
          <Link
            href="/workspace/post-queue"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-white/80 hover:text-zinc-800"
          >
            Queue
          </Link>
        </nav>
      </header>

      <div className="grid min-w-0 gap-10 xl:grid-cols-[1fr_minmax(280px,360px)] xl:gap-14 2xl:gap-16">
        <section className="min-w-0 space-y-8">
          {connected && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <strong className="capitalize">{connected}</strong> connected successfully.
              </span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="font-medium">Connection failed:</span> {error}
                {detail && (
                  <p className="mt-1 text-xs text-red-600">{decodeURIComponent(detail)}</p>
                )}
              </div>
            </div>
          )}
          {substackSuccess && (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {substackSuccess}
            </div>
          )}
          {substackError && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {substackError}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-3 py-16 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading connections…</span>
            </div>
          ) : hasConnections ? (
            <div>
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">Your connections</h2>
              <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
                {channels.map((channel) => {
                  const meta = PLATFORM_META[channel.platform];
                  return (
                    <li
                      key={channel.id}
                      className="flex min-h-[5.5rem] flex-col justify-between rounded-2xl bg-zinc-50/50 p-4 transition-colors hover:bg-zinc-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-11 w-11 shrink-0">
                          {channel.avatarUrl ? (
                            <img
                              src={channel.avatarUrl}
                              alt={channel.accountName}
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
                              {(channel.accountName || meta?.label || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white p-0.5 [&>img]:h-3.5 [&>img]:w-3.5 [&>svg]:h-3.5 [&>svg]:w-3.5">
                            {meta?.icon}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {channel.accountName || meta?.label}
                          </p>
                          <p className="text-xs capitalize text-zinc-500">{channel.platform}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDisconnectChannel(channel.id)}
                        className="mt-3 self-end text-xs text-zinc-500 transition-colors hover:text-red-600"
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
                      className="flex min-h-[5.5rem] flex-col justify-between rounded-2xl bg-white p-4 transition-colors hover:bg-zinc-50/80"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-11 w-11 shrink-0">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt=""
                              className="h-11 w-11 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const el = document.getElementById(`ch-fallback-${source.id}`);
                                el?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div
                            id={`ch-fallback-${source.id}`}
                            className={`flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-600 ${imgUrl ? "hidden" : ""}`}
                          >
                            <Rss className="h-5 w-5" />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white p-1">
                            {source.platform === "custom_rss" ? (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-orange-500 text-white p-0.5">
                                <Rss className="h-2.5 w-2.5 stroke-[2.5]" />
                              </div>
                            ) : (
                              <img
                                src="https://cdn.worldvectorlogo.com/logos/substack-1.svg"
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-zinc-900 hover:underline"
                          >
                            {source.url.replace("https://", "").replace("/feed", "")}
                          </a>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            <span>{source.articleCount || 0} articles</span>
                            {source.lastSyncedAt && (
                              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                                <RefreshCw className="h-3 w-3" />
                                {new Date(source.lastSyncedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDisconnectSource(source.id)}
                        className="mt-3 self-end text-xs text-zinc-500 transition-colors hover:text-red-600"
                      >
                        Disconnect
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl bg-zinc-50/80 px-8 py-14 text-center text-zinc-600">
              <Link2 className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
              <p>No connections yet. Add a destination or Substack below.</p>
            </div>
          )}

          <div className="mt-10">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Add destinations</h2>
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
                      ? "cursor-default bg-zinc-100 text-zinc-400"
                      : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                      }`}
                  >
                    <div className={isConnected ? "text-zinc-300" : meta.color}>{meta.icon}</div>
                    <span>{meta.label}</span>
                    {isConnected ? (
                      <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Plus className="ml-auto h-4 w-4 shrink-0 text-zinc-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-gradient-to-b from-zinc-50 to-white p-6 sm:p-8 border border-zinc-100/80 shadow-2xs">
              <div className="flex items-center gap-4 border-b border-zinc-100 pb-3 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setSyncTab("substack");
                    setUrlInput("");
                    setSubstackError("");
                    setSubstackSuccess("");
                  }}
                  className={`pb-1.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    syncTab === "substack"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <img
                    src="https://cdn.worldvectorlogo.com/logos/substack-1.svg"
                    alt=""
                    className="h-3.5 w-3.5 object-contain"
                  />
                  Substack
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSyncTab("custom_rss");
                    setUrlInput("");
                    setSubstackError("");
                    setSubstackSuccess("");
                  }}
                  className={`pb-1.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    syncTab === "custom_rss"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <Rss className="h-3.5 w-3.5 shrink-0" />
                  Blog (RSS)
                </button>
              </div>

              {syncTab === "substack" ? (
                <div>
                  <p className="mb-5 text-xs leading-relaxed text-zinc-600">
                    Enter your Substack publication URL—we normalize to the RSS feed and import issues automatically.
                  </p>
                  <form onSubmit={handleAddSubstack} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://yourname.substack.com"
                      className="min-h-[44px] flex-1 rounded-xl bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 border border-zinc-200"
                      disabled={isSubmittingSubstack}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingSubstack || !urlInput}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {isSubmittingSubstack ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Sync Substack
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <p className="mb-5 text-xs leading-relaxed text-zinc-600">
                    Enter your blog URL or RSS feed URL—we support WordPress, Medium, Ghost, or any custom RSS feed.
                  </p>
                  <form onSubmit={handleAddSubstack} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://myblog.com or https://medium.com/feed/@username"
                      className="min-h-[44px] flex-1 rounded-xl bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 border border-zinc-200"
                      disabled={isSubmittingSubstack}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingSubstack || !urlInput}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {isSubmittingSubstack ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Sync Blog
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {hasConnections && (
            <div className="rounded-2xl bg-zinc-100/80 px-5 py-4">
              <p className="text-sm text-zinc-700">
                <strong className="font-medium text-zinc-900">Next:</strong>{" "}
                <Link href="/workspace/create" className="font-medium text-primary-800 underline-offset-4 hover:underline">
                  Open Create
                </Link>{" "}
                to pull angles from any synced issue.
              </p>
            </div>
          )}
        </section>

        <aside className="min-w-0 xl:max-w-md xl:justify-self-end">
          <div className="sticky top-6 rounded-2xl bg-gradient-to-b from-zinc-50 to-white p-6">
            <div className="mb-5 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-zinc-900">Why this step exists</h3>
            </div>
            <ul className="space-y-5">
              {AFTER_CONNECT.map(({ title, body }) => (
                <li key={title}>
                  <p className="text-sm font-medium text-zinc-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">{body}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/workspace/create"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200/70"
            >
              Continue to Create
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>

      {/* Premium Conversion Popup Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Glassmorphic backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowAuthModal(false)}
          />
          
          {/* Premium Card Container */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                <Plug className="h-7 w-7 animate-pulse" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                Unlock Channel Connections
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                You're currently exploring in <strong className="text-indigo-600 font-bold">Sandbox Mode</strong>. Connect your own channels to start repurposing and publishing newsletter issues automatically.
              </p>
            </div>

            {/* Features */}
            <ul className="mt-6 space-y-3.5 border-t border-zinc-100/50 pt-6">
              {[
                "Publish automatically with one-click dispatch",
                "Fully customizable tone of voice models",
                "Direct API channels: X, LinkedIn, Threads, Instagram",
                "Seamless custom RSS and Substack syncing"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-zinc-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/auth/signup"
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                Create Free Account
              </Link>
              <Link
                href="/auth/signin"
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.99] text-sm"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="mt-1 text-xs text-zinc-400 font-medium hover:text-zinc-600 transition-colors"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
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
