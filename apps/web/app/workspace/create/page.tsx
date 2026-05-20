"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api-config";
import {
  ArrowLeft,
  Lightbulb,
  Loader2,
  RefreshCw,
  ChevronRight,
  Layers,
  Link2,
  Sparkles,
  Target,
  Copy,
  Check,
  Calendar,
  Send,
  Instagram,
  LayoutGrid,
  Kanban,
  Save,
  Volume2,
  Zap,
  Rss,
} from "lucide-react";
import { LINKEDIN_LOGO, X_LOGO, FACEBOOK_LOGO, INSTAGRAM_LOGO, THREADS_LOGO } from "@/app/constants";
import { authClient } from "../../../lib/auth-client";

const MOCK_ARTICLE = {
  id: "mock-a1",
  title: "Growth Secrets: How we hit 10,000 subscribers in 6 months",
  url: "https://creators.substack.com/p/growth-secrets",
  publishedAt: new Date().toISOString(),
  sourceId: "mock-s1",
  createdAt: new Date().toISOString(),
  angleCount: 3,
  anglesExtractedAt: null,
  draftCount: 0,
  sourcePlatform: "substack"
};

const MOCK_ANGLES = [
  "Consistency beats virality: We published every Tuesday at 9 AM without fail.",
  "The lead-magnet framework: Offering a free playbook drove 40% of our waitlist signups.",
  "Platform-native writing: We never just shared links, we rewrote our posts as native content for LinkedIn and X."
];

const MOCK_DRAFTS = [
  {
    id: "mock-d1",
    status: "draft",
    channel: {
      platform: "linkedin",
      accountName: "Sarah Chen (Founder)",
      avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
    },
    content: {
      text: "Most creators think newsletter growth requires a viral hit.\n\nAfter hitting 10,000 subscribers in 6 months, I can tell you: consistency beats virality.\n\nWe published every Tuesday at 9 AM without fail. Our open rate stayed at 48%.\n\n⚡ The playbook is simple:\n• Pick a schedule and stick to it\n• Never post raw links - translate them to native value posts\n• Build a high-value lead magnet\n\nWhat's your newsletter publication schedule?"
    }
  },
  {
    id: "mock-d2",
    status: "draft",
    channel: {
      platform: "x",
      accountName: "sarah_growth",
      avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
    },
    content: {
      text: "We hit 10k newsletter subscribers in 6 months.\n\nNo paid ads. No massive budget.\n\nJust 3 simple rules:\n1/ Consistency beats virality (published every Tuesday 9 AM)\n2/ Used high-value playbooks as lead magnets (40% of signups)\n3/ Shared platform-native hooks instead of raw links\n\nRead the full blueprint here 👇"
    }
  },
  {
    id: "mock-d3",
    status: "draft",
    channel: {
      platform: "threads",
      accountName: "sarah_chen",
      avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
    },
    content: {
      text: "Consistency beats virality every single time.\n\nWe published every Tuesday at 9 AM without fail. Our open rate stayed at 48%.\n\n⚡ The playbook is simple:\n• Pick a schedule and stick to it\n• Never post raw links - translate them to native value posts\n• Build a high-value lead magnet\n\nWhat's your newsletter publication schedule?"
    }
  },
  {
    id: "mock-d4",
    status: "draft",
    channel: {
      platform: "instagram",
      accountName: "sarah_insta",
      avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg"
    },
    content: {
      text: "We hit 10,000 subscribers in 6 months. How? We published every Tuesday at 9 AM without fail. Consistency is the magic formula. ✨\n\nWhat's your posting rhythm?"
    }
  }
];

const platformLogos: Record<string, string> = {
  linkedin: LINKEDIN_LOGO,
  x: X_LOGO,
  facebook: FACEBOOK_LOGO,
  instagram: INSTAGRAM_LOGO,
  threads: THREADS_LOGO,
};

interface ArticleListItem {
  id: string;
  title: string;
  url: string | null;
  publishedAt: string | null;
  sourceId: string | null;
  createdAt: string;
  angleCount: number;
  anglesExtractedAt: string | null;
  draftCount?: number;
  sourcePlatform?: string | null;
}

const VS_CHATGPT = [
  {
    icon: Link2,
    title: "Starts from your synced issue",
    body: "No copy-paste or lost context. We read the same HTML your readers got, tied to your publication.",
  },
  {
    icon: Target,
    title: "Angles, not a recap",
    body: "Each line is one claim, hook, or stat to build from, so posts don't collapse into the same vague summary.",
  },
  {
    icon: Layers,
    title: "Built for platform shapes next",
    body: "LinkedIn spacing, X length, IG caption rhythm - drafts follow how each network rewards structure, not one blob for all.",
  },
  {
    icon: Volume2,
    title: "Voice consistency",
    body: "Trains directly on your past writing style. Your drafts actually sound like you, not a generic robot.",
  },
  {
    icon: Zap,
    title: "Native platform structure preservation",
    body: "Adheres strictly to modern formatting constraints. Posts look perfectly spaced and styled natively for each platform.",
  },
] as const;

export default function CreatePage() {
  const session = authClient.useSession();
  const isGuest = !session.isPending && !session.data?.user;

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [articles, setArticles] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [selected, setSelected] = useState<any | null>(null);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [selectedAngles, setSelectedAngles] = useState<Set<number>>(new Set());
  const [ideasMeta, setIdeasMeta] = useState<{ cached: boolean } | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState("");

  const [drafts, setDrafts] = useState<any[]>([]);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState("");
  const [showDraftsView, setShowDraftsView] = useState(false);
  const [attachLink, setAttachLink] = useState(true);

  const generateDrafts = async () => {
    if (!selected || selectedAngles.size === 0) return;
    setGeneratingDrafts(true);
    setDraftsError("");

    if (isGuest) {
      // Simulate draft generation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const simulatedDrafts = MOCK_DRAFTS.map(d => {
        if (attachLink && MOCK_ARTICLE.url) {
          const hasLink = d.content.text.includes(MOCK_ARTICLE.url);
          return {
            ...d,
            content: {
              ...d.content,
              text: hasLink ? d.content.text : `${d.content.text}\n\nRead the full article: ${MOCK_ARTICLE.url}`
            }
          };
        }
        return d;
      });
      setDrafts(simulatedDrafts);
      setShowDraftsView(true);
      setGeneratingDrafts(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/articles/${selected.id}/drafts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAngles: Array.from(selectedAngles).map((idx) => ideas[idx]),
          attachLink,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to generate drafts");
      }
      setDrafts(data.drafts || []);
      setShowDraftsView(true);
    } catch (e: any) {
      setDraftsError(e.message || "Failed to generate drafts");
    } finally {
      setGeneratingDrafts(false);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(new Set());

  // Custom post scheduling modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingDraftId, setSchedulingDraftId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [scheduling, setScheduling] = useState(false);

  const suggestAutoScheduleSlot = async () => {
    try {
      const res = await fetch(`${API_URL}/articles/drafts/queue`, { credentials: "include" });
      if (res.ok) {
        const queue = (await res.json()) as any[];
        const futurePosts = queue
          .filter((p: any) => p.status === 'scheduled' && p.scheduledAt)
          .map((p: any) => new Date(p.scheduledAt))
          .sort((a: Date, b: Date) => b.getTime() - a.getTime());

        let baseDate = new Date();
        const latestPostDate = futurePosts[0];
        if (latestPostDate) {
          baseDate = latestPostDate;
        }

        const suggestedDate = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000);

        const hours = suggestedDate.getHours();
        if (hours >= 19 || hours < 8) {
          suggestedDate.setDate(suggestedDate.getDate() + (hours >= 19 ? 1 : 0));
          suggestedDate.setHours(9);
          suggestedDate.setMinutes(0);
        } else {
          const mins = suggestedDate.getMinutes();
          if (mins < 15) {
            suggestedDate.setMinutes(0);
          } else if (mins < 45) {
            suggestedDate.setMinutes(30);
          } else {
            suggestedDate.setHours(suggestedDate.getHours() + 1);
            suggestedDate.setMinutes(0);
          }
        }

        const yyyy = suggestedDate.getFullYear();
        const mm = String(suggestedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(suggestedDate.getDate()).padStart(2, '0');

        const hh = String(suggestedDate.getHours()).padStart(2, '0');
        const minStr = String(suggestedDate.getMinutes()).padStart(2, '0');

        setScheduledDate(`${yyyy}-${mm}-${dd}`);
        setScheduledTime(`${hh}:${minStr}`);
      }
    } catch (e) {
      console.error("Auto-schedule suggestion failed:", e);
    }
  };

  const openScheduleModal = (draftId: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    setSchedulingDraftId(draftId);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
    setScheduledTime("09:00");

    setIsScheduleModalOpen(true);
    suggestAutoScheduleSlot();
  };

  const confirmSchedule = async () => {
    if (!schedulingDraftId || !scheduledDate || !scheduledTime) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      const res = await fetch(`${API_URL}/articles/drafts/${schedulingDraftId}/schedule`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      if (res.ok) {
        setScheduledIds((prev) => {
          const next = new Set(prev);
          next.add(schedulingDraftId);
          return next;
        });

        setDrafts((prev) =>
          prev.map((d) => (d.id === schedulingDraftId ? { ...d, status: "scheduled", scheduledAt } : d))
        );

        setIsScheduleModalOpen(false);
        setSchedulingDraftId(null);
      }
    } catch (e) {
      console.error("Failed to schedule draft:", e);
    } finally {
      setScheduling(false);
    }
  };

  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [savedDraftIds, setSavedDraftIds] = useState<Set<string>>(new Set());
  const [savedDraftIdsPersisted, setSavedDraftIdsPersisted] = useState<Set<string>>(new Set());

  const [latestDraft, setLatestDraft] = useState<{
    article: { id: string; title: string; createdAt: string } | null;
    drafts: any[];
  } | null>(null);

  const [activeWorkspaces, setActiveWorkspaces] = useState<any[]>([]);

  const fetchLatestDraft = useCallback(async () => {
    if (isGuest) {
      setLatestDraft(null);
      setActiveWorkspaces([]);
      return;
    }

    try {
      const [resLatest, resActive] = await Promise.all([
        fetch(`${API_URL}/articles/drafts/latest`, { credentials: "include" }),
        fetch(`${API_URL}/articles/drafts/active`, { credentials: "include" })
      ]);

      if (resLatest.ok) {
        const data = (await resLatest.json()) as any;
        if (data.article && data.drafts && data.drafts.length > 0) {
          setLatestDraft(data);
        } else {
          setLatestDraft(null);
        }
      }

      if (resActive.ok) {
        const dataActive = (await resActive.json()) as any[];
        setActiveWorkspaces(dataActive);
      }
    } catch (e) {
      console.error("Failed to fetch drafts:", e);
    }
  }, [isGuest]);

  const saveDraft = async (draftId: string, text: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    if (!selected) return;
    setSavingDraftId(draftId);
    try {
      const res = await fetch(`${API_URL}/articles/${selected.id}/drafts/${draftId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to save draft");
      }
      setSavedDraftIds((prev) => {
        const next = new Set(prev);
        next.add(draftId);
        return next;
      });
      setSavedDraftIdsPersisted((prev) => {
        const next = new Set(prev);
        next.add(draftId);
        return next;
      });
      setTimeout(() => {
        setSavedDraftIds((prev) => {
          const next = new Set(prev);
          next.delete(draftId);
          return next;
        });
      }, 2000);

      // Refresh the latest draft box to keep it in sync
      fetchLatestDraft();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDraftId(null);
    }
  };

  const resumeLatestDraft = () => {
    if (!latestDraft || !latestDraft.article) return;
    setSelected(latestDraft.article as any);
    setDrafts(latestDraft.drafts);
    if (latestDraft.drafts) {
      setSavedDraftIdsPersisted(new Set(latestDraft.drafts.map((d: any) => d.id)));
    }
    setShowDraftsView(true);
  };

  const handleDraftChange = (id: string, text: string) => {
    const sanitized = text.replace(/\u2014/g, "-").replace(/—/g, "-");
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, content: { ...d.content, text: sanitized } } : d))
    );
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSchedule = (id: string) => {
    openScheduleModal(id);
  };

  const fetchArticles = useCallback(async () => {
    if (isGuest) {
      setArticles([MOCK_ARTICLE]);
      setLoadingList(false);
      return;
    }

    setLoadingList(true);
    setListError("");
    try {
      const res = await fetch(`${API_URL}/articles`, { credentials: "include" });
      const data = (await res.json()) as {
        articles?: any[];
        error?: string;
        details?: string;
      };
      if (!res.ok) {
        const msg = [data.error, data.details].filter(Boolean).join(" — ");
        throw new Error(msg || "Failed to load articles");
      }
      setArticles(data.articles || []);
    } catch (e: any) {
      setListError(e.message || "Failed to load articles");
      setArticles([]);
    } finally {
      setLoadingList(false);
    }
  }, [isGuest]);

  useEffect(() => {
    fetchArticles();
    fetchLatestDraft();
  }, [fetchArticles, fetchLatestDraft]);

  const loadIdeas = async (article: any, force: boolean) => {
    setSelected(article);
    setIdeasError("");
    setLoadingIdeas(true);
    setIdeas([]);
    setSelectedAngles(new Set());
    setIdeasMeta(null);
    setDrafts([]);
    setDraftsError("");

    if (isGuest) {
      // Simulate loading angles/ideas
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIdeas(MOCK_ANGLES);
      setIdeasMeta({ cached: true });
      setLoadingIdeas(false);
      return;
    }

    try {
      if (!force) {
        // 1. Fetch individual article details & existing drafts
        const res = await fetch(`${API_URL}/articles/${article.id}`, { credentials: "include" });
        const data = (await res.json()) as any;
        if (!res.ok) {
          throw new Error(data.message || data.error || "Failed to load newsletter details");
        }

        // 2. Check if drafts already exist!
        if (data.drafts && data.drafts.length > 0) {
          setDrafts(data.drafts);
          setSavedDraftIdsPersisted(new Set(data.drafts.map((d: any) => d.id)));
          setShowDraftsView(true);
          setIdeas(data.article.angles || []);
          setLoadingIdeas(false);
          return;
        }

        // 3. If no drafts, check if angles are already cached
        if (data.article.angles && data.article.angles.length > 0) {
          setIdeas(data.article.angles);
          setIdeasMeta({ cached: true });
          setLoadingIdeas(false);
          return;
        }
      }

      // 4. If force is true or no cached data, run extraction!
      const extractRes = await fetch(`${API_URL}/articles/${article.id}/ideas`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const extractData = (await extractRes.json()) as any;
      if (extractRes.status === 402) {
        throw new Error(extractData.message || extractData.error || "Not enough credits");
      }
      if (!extractRes.ok) {
        const msg = [extractData.error, extractData.message, extractData.details].filter(Boolean).join(" — ");
        throw new Error(msg || "Could not extract angles");
      }
      setIdeas(extractData.ideas || []);
      setIdeasMeta({ cached: !!extractData.cached });
    } catch (e: any) {
      setIdeasError(e.message || "Failed to load newsletter");
    } finally {
      setLoadingIdeas(false);
    }
  };

  const toggleAngle = (index: number) => {
    setSelectedAngles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      {/* Top bar: step + title — full width */}
      <header className="mb-10 flex flex-col gap-6 border-b border-zinc-100 pb-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl lg:max-w-none lg:flex-1">

          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                Create
              </h1>

            </div>
          </div>
        </div>

        <nav
          className="flex shrink-0 flex-wrap gap-1 rounded-xl bg-zinc-100/90 p-1 text-xs font-medium text-zinc-500"
          aria-label="Repurpose steps"
        >
          <Link
            href="/workspace/channels"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-white/80 hover:text-zinc-800"
          >
            Connect
          </Link>
          <button
            type="button"
            disabled={!selected}
            onClick={() => setShowDraftsView(false)}
            className={`rounded-lg px-3 py-2 transition-colors hover:text-zinc-800 ${!showDraftsView && selected
                ? "bg-white text-zinc-900 font-semibold"
                : "hover:bg-white/80"
              }`}
          >
            Angles
          </button>
          <span
            className={`rounded-lg px-3 py-2 ${showDraftsView
                ? "bg-white text-zinc-900 font-semibold"
                : "opacity-50"
              }`}
          >
            Drafts
          </span>
          <Link
            href="/workspace/post-queue"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-white/80 hover:text-zinc-800"
          >
            Queue
          </Link>
        </nav>
      </header>

      {showDraftsView ? (
        <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            type="button"
            onClick={() => setShowDraftsView(false)}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to angles
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                Platform Native Drafts
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Customize or tweak what drafted for your channels before sending them to the pipeline.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex shrink-0 items-center rounded-xl bg-zinc-100 p-1 text-xs font-medium text-zinc-500 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${viewMode === "grid"
                    ? "bg-white text-zinc-900 "
                    : "hover:text-zinc-800"
                  }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${viewMode === "kanban"
                    ? "bg-white text-zinc-900"
                    : "hover:text-zinc-800"
                  }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                Kanban
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const platformOrder = ["linkedin", "x", "threads", "instagram"];
                return [...drafts].sort((a, b) => {
                  const orderA = platformOrder.indexOf(a.channel.platform);
                  const orderB = platformOrder.indexOf(b.channel.platform);
                  return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
                });
              })().map((draft) => {
                const platformColors = {
                  linkedin: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                  x: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                  instagram: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                  threads: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                };

                const platformLabels = {
                  linkedin: "LinkedIn",
                  x: "X",
                  instagram: "Instagram",
                  threads: "Threads",
                };

                const platformClass = platformColors[draft.channel.platform as keyof typeof platformColors] || "border-zinc-200 bg-zinc-50/10";
                const label = platformLabels[draft.channel.platform as keyof typeof platformLabels] || draft.channel.platform;

                const isCopied = copiedId === draft.id;
                const isScheduled = scheduledIds.has(draft.id);

                return (
                  <div
                    key={draft.id}
                    className={`flex flex-col justify-between rounded-xl border border-zinc-100 p-5 transition-all ${platformClass}`}
                  >
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-8 w-8 shrink-0">
                            {draft.channel.avatarUrl ? (
                              <img
                                src={draft.channel.avatarUrl}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-black">
                                {(draft.channel.accountName || label).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
                              <img
                                src={platformLogos[draft.channel.platform] || INSTAGRAM_LOGO}
                                alt={draft.channel.platform}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 leading-tight">
                              {label}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-light">
                              {draft.channel.accountName || "Connected Channel"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-semibold text-zinc-600 uppercase">
                          Draft
                        </span>
                      </div>

                      <textarea
                        value={draft.content.text}
                        onChange={(e) => handleDraftChange(draft.id, e.target.value)}
                        className="w-full h-44 rounded-xl border border-zinc-100 bg-white p-3.5 text-sm leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal resize-none"
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100/50 pt-4">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleCopy(draft.id, draft.content.text)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={savingDraftId === draft.id}
                          onClick={() => saveDraft(draft.id, draft.content.text)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                        >
                          {savingDraftId === draft.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                              Saving...
                            </>
                          ) : savedDraftIds.has(draft.id) ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              Saved!
                            </>
                          ) : (
                            <>
                              <Save className="h-3.5 w-3.5 text-zinc-400" />
                              Save
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isScheduled}
                          onClick={() => handleSchedule(draft.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold  transition-colors ${isScheduled
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-100 cursor-default"
                              : "bg-primary text-white hover:bg-zinc-800"
                            }`}
                        >
                          {isScheduled ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Scheduled
                            </>
                          ) : (
                            <>
                              <Calendar className="h-3.5 w-3.5" />
                              Schedule
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 w-full pb-6">
              {["draft", "scheduled", "published"].map((columnKey) => {
                const columnLabels = {
                  draft: "Draft",
                  scheduled: "Scheduled",
                  published: "Published",
                };

                const columnDescriptions = {
                  draft: "Newly generated or approved content",
                  scheduled: "Posts queued in the dispatch timeline",
                  published: "Sent or completed social posts",
                };


                const columnColors = {
                  draft: "bg-indigo-50/10 border-indigo-100/50",
                  scheduled: "bg-amber-50/10 border-amber-100/50",
                  published: "bg-emerald-50/10 border-emerald-100/50",
                };

                const label = columnLabels[columnKey as keyof typeof columnLabels];
                const description = columnDescriptions[columnKey as keyof typeof columnDescriptions];
                const columnColor = columnColors[columnKey as keyof typeof columnColors];

                // Platform configuration for card styling
                const platformColors = {
                  linkedin: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                  x: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                  instagram: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                  threads: "border-zinc-200 bg-zinc-50/10 hover:border-zinc-300",
                };

                const platformLabels = {
                  linkedin: "LinkedIn",
                  x: "X",
                  instagram: "Instagram",
                  threads: "Threads",
                };

                // Dynamic classification of drafts by stage
                let columnDrafts = [];
                if (columnKey === "published") {
                  columnDrafts = drafts.filter((d) => d.status === "published");
                } else if (columnKey === "scheduled") {
                  columnDrafts = drafts.filter((d) => (scheduledIds.has(d.id) || d.status === "scheduled") && d.status !== "published");
                } else {
                  // All drafts that are not scheduled or published
                  columnDrafts = drafts.filter((d) => !scheduledIds.has(d.id) && d.status !== "scheduled" && d.status !== "published");
                }

                return (
                  <div
                    key={columnKey}
                    className={`flex flex-col gap-4 flex-1 min-w-[280px] rounded-2xl bg-zinc-50  p-4 `}
                  >
                    {/* Column Header */}
                    <div className="flex flex-col gap-1 pb-3 ">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-900 leading-none">{label}</span>
                        </div>
                        <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                          {columnDrafts.length}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-light mt-0.5">{description}</span>
                    </div>

                    {/* Column Content */}
                    <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
                      {columnDrafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-white/40">
                          <p className="text-[11px] font-medium text-zinc-400">No {label.toLowerCase()} posts</p>
                        </div>
                      ) : (
                        columnDrafts.map((draft) => {
                          const isCopied = copiedId === draft.id;
                          const isScheduled = scheduledIds.has(draft.id);
                          const platformClass = platformColors[draft.channel.platform as keyof typeof platformColors] || "border-zinc-200 bg-zinc-50/10";
                          const platformLabel = platformLabels[draft.channel.platform as keyof typeof platformLabels] || draft.channel.platform;

                          return (
                            <div
                              key={draft.id}
                              className={`flex flex-col justify-between rounded-xl border border-zinc-100 p-4 transition-all bg-white bg-zinc-100 ${platformClass}`}
                            >
                              {/* Card Header */}
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="relative h-6 w-6 shrink-0">
                                    {draft.channel.avatarUrl ? (
                                      <img
                                        src={draft.channel.avatarUrl}
                                        alt=""
                                        className="h-6 w-6 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-black">
                                        {(draft.channel.accountName || platformLabel).charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
                                      <img
                                        src={platformLogos[draft.channel.platform] || INSTAGRAM_LOGO}
                                        alt={draft.channel.platform}
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-zinc-900  truncate max-w-[120px]">
                                    {draft.channel.accountName || "Connected Channel"}
                                  </p>
                                </div>
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[8px] font-semibold text-zinc-500 uppercase flex items-center gap-1">
                                  <img
                                    src={platformLogos[draft.channel.platform] || INSTAGRAM_LOGO}
                                    alt={draft.channel.platform}
                                    className="h-3 w-3 object-contain"
                                  />
                                  {draft.channel.platform}
                                </span>
                              </div>

                              <textarea
                                value={draft.content.text}
                                onChange={(e) => handleDraftChange(draft.id, e.target.value)}
                                className="w-full h-36 rounded-xl border border-zinc-100 bg-white p-2.5 text-xs leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal resize-none"
                              />

                              <div className="mt-4 flex items-center justify-between border-t border-zinc-100/50 pt-3">
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(draft.id, draft.content.text)}
                                    className="inline-flex items-center gap-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        Copy
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={savingDraftId === draft.id}
                                    onClick={() => saveDraft(draft.id, draft.content.text)}
                                    className="inline-flex items-center gap-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                                  >
                                    {savingDraftId === draft.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                                        Saving
                                      </>
                                    ) : savedDraftIds.has(draft.id) ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        Saved
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-3 w-3 text-zinc-400" />
                                        Save
                                      </>
                                    )}
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  disabled={isScheduled}
                                  onClick={() => handleSchedule(draft.id)}
                                  className={`inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold  transition-colors ${isScheduled
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100 cursor-default"
                                      : "bg-primary text-white hover:bg-zinc-800"
                                    }`}
                                >
                                  {isScheduled ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      Scheduled
                                    </>
                                  ) : (
                                    <>
                                      <Calendar className="h-3 w-3" />
                                      Schedule
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : !selected ? (
        <div className="grid min-w-0 gap-10 xl:grid-cols-[1fr_minmax(280px,360px)] xl:gap-14 2xl:gap-16">
          {/* Main column */}
          <section className="min-w-0">
            {listError && (
              <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {listError}
              </div>
            )}

            {loadingList ? (
              <div className="flex items-center gap-3 py-16 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading synced issues…</span>
              </div>
            ) : articles.length === 0 ? (
              <div className="rounded-2xl bg-zinc-50/80 px-8 py-14 text-center">
                <p className="text-zinc-700">
                  No issues in your workspace yet. Connect Substack and run a sync so posts land
                  here automatically.
                </p>
                <Link
                  href="/workspace/channels"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Connections
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                {activeWorkspaces && activeWorkspaces.length > 0 && (
                  <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5">
                    <div className="mb-4 flex items-center gap-2 pb-3 border-b border-zinc-100">
                      <span className="text-xs font-bold text-zinc-500">
                        Active Drafts Workspaces ({activeWorkspaces.length})
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {activeWorkspaces.map((workspace) => (
                        <div key={workspace.article.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100/60 transition-colors">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-900 leading-snug truncate max-w-[500px]">
                              {workspace.article.title}
                            </h4>
                            <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                              {workspace.drafts.length} social drafts ready
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(workspace.article as any);
                              setDrafts(workspace.drafts);
                              setSavedDraftIdsPersisted(new Set(workspace.drafts.map((d: any) => d.id)));
                              setShowDraftsView(true);
                            }}
                            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors"
                          >
                            Resume Workspace
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="mb-4 text-sm font-semibold text-zinc-900">Select newsletter </h2>
                <ul className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {articles.map((a) => (
                    <li key={a.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => loadIdeas(a, false)}
                        className="group relative flex h-full w-full flex-col rounded-2xl bg-zinc-50/80 p-4 text-left transition-colors hover:bg-zinc-100/80"
                      >
                        <p className="line-clamp-3 text-sm font-medium leading-snug text-zinc-900 group-hover:text-zinc-950">
                          {a.title}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                          <span>
                            {a.publishedAt
                              ? new Date(a.publishedAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                              : "Date unknown"}
                          </span>
                          {a.angleCount > 0 && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                              {a.angleCount} angles saved
                            </span>
                          )}
                          {a.draftCount && a.draftCount > 0 ? (
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-800 inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                              {a.draftCount} drafts active
                            </span>
                          ) : null}
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-black opacity-0 transition-opacity group-hover:opacity-100">
                          {a.draftCount && a.draftCount > 0 ? "Resume active workspace" : "Extract angles"}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                        {a.sourcePlatform === "substack" && (
                          <div className="absolute bottom-4 right-4 flex h-5 w-5 items-center justify-center rounded-md bg-white p-1 shadow-2xs border border-zinc-100/80 transition-opacity group-hover:opacity-20 opacity-100">
                            <img
                              src="https://cdn.worldvectorlogo.com/logos/substack-1.svg"
                              alt="Substack"
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        {a.sourcePlatform === "custom_rss" && (
                          <div className="absolute bottom-4 right-4 flex h-5 w-5 items-center justify-center rounded-md bg-orange-500 p-1 shadow-2xs border border-orange-600/80 transition-opacity group-hover:opacity-20 opacity-100 text-white">
                            <Rss className="h-3 w-3 stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Differentiation rail — desktop sidebar */}
          <aside className="min-w-0 xl:max-w-md xl:justify-self-end">
            <div className="sticky top-6 rounded-2xl bg-gradient-to-b from-zinc-50 to-white p-6">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-black font-light" />
                <h3 className="text-sm font-semibold text-zinc-900">Why not just ChatGPT?</h3>
              </div>
              <ul className="space-y-5">
                {VS_CHATGPT.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                      <Icon className="h-4 w-4 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : (
        <div className="min-w-0 space-y-8">
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setIdeas([]);
              setIdeasError("");
              setIdeasMeta(null);
              setSelectedAngles(new Set());
              fetchArticles();
            }}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All issues
          </button>

          <div className="grid min-w-0 gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="rounded-2xl bg-zinc-50/80 p-5 lg:sticky lg:top-6">
                <p className="text-[10px] font-light text-black">
                  Selected newsletter
                </p>
                <a href={selected.url || ""} target="_blank" rel="noopener noreferrer" className="mt-2 text-base font-semibold leading-snug text-black/60 underline underline-offset-2 decoration-dotted hover:text-black">
                  {selected.title}
                </a>
                <p className="mt-2 text-xs text-zinc-500">
                  {selected.publishedAt
                    ? new Date(selected.publishedAt).toLocaleString()
                    : ""}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={loadingIdeas}
                    onClick={() => loadIdeas(selected, false)}
                    className="w-full rounded-xl bg-white px-3 py-2.5 text-left text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Reload saved angles
                  </button>
                  <button
                    type="button"
                    disabled={loadingIdeas}
                    onClick={() => {
                      if (
                        !confirm(
                          "Re-run extraction? Uses 1 credit and replaces saved angles for this issue."
                        )
                      )
                        return;
                      loadIdeas(selected, true);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 text-white rounded-xl bg-primary px-3 py-2.5 text-xs font-medium transition-colors hover:bg-primary/80 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-extract (1 credit)
                  </button>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-8 xl:col-span-9">
              {ideasError && (
                <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  {ideasError}
                </div>
              )}

              {loadingIdeas && (
                <div className="flex flex-col items-start gap-3 rounded-2xl bg-zinc-50/80 px-6 py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Pulling angles from your issue…</p>
                    <p className="mt-1 max-w-lg text-xs text-zinc-600">
                      We look for standalone hooks and claims—not a single recap—so each line can
                      become its own post.
                    </p>
                  </div>
                </div>
              )}

              {!loadingIdeas && ideas.length > 0 && (
                <div>
                  <div className="mb-5 flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">Choose your angles</h3>
                      <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                        Select one or more. Next step turns each into drafts that match how LinkedIn,
                        X, and Instagram actually read—not one block of text for every network.
                      </p>
                    </div>
                    {ideasMeta?.cached && (
                      <span className="shrink-0 self-start rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-800">
                        Cached · no credit
                      </span>
                    )}
                  </div>

                  <ul className="grid min-w-0 gap-3 md:grid-cols-2">
                    {ideas.map((idea, i) => {
                      const on = selectedAngles.has(i);
                      return (
                        <li key={i} className="min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleAngle(i)}
                            className={`flex h-full min-h-[5.5rem] w-full flex-col rounded-2xl p-4 text-left text-sm leading-relaxed transition-colors ${on
                              ? "bg-primary-50 text-zinc-900"
                              : "bg-zinc-50/80 text-zinc-800 hover:bg-zinc-100/80"
                              }`}
                          >
                            <span className="mb-2 text-[10px] font-bold text-zinc-400">
                              Angle {i + 1}
                            </span>
                            <span className="text-[15px] leading-snug">{idea}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {draftsError && (
                    <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                      {draftsError}
                    </div>
                  )}

                  <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-zinc-100/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-700">
                      <strong className="font-medium text-zinc-900">
                        {selectedAngles.size > 0
                          ? `${selectedAngles.size} selected`
                          : "Nothing selected yet"}
                      </strong>
                      {selectedAngles.size > 0
                        ? " — ready to generate your native platform drafts."
                        : " — tap the cards you want to turn into posts."}
                    </p>
                    {selectedAngles.size > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            checked={attachLink}
                            onChange={(e) => setAttachLink(e.target.checked)}
                            className="h-4.5 w-4.5 rounded-md border-zinc-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-colors"
                          />
                          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                            Attach original article link
                          </span>
                        </label>
                        <button
                          type="button"
                          disabled={generatingDrafts}
                          onClick={generateDrafts}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-light text-white transition-colors hover:bg-primary/80 disabled:opacity-50 shrink-0"
                        >
                          {generatingDrafts ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Drafting posts...
                            </>
                          ) : (
                            <>
                              Generate Drafts
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Schedule Modal Backdrop */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              Schedule Post Dispatch
            </h3>
            <p className="mt-1 text-xs text-zinc-500 font-light">
              Select the publication day and time. Autoscheduling finds the next available empty queue slot.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Publish Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Smart Suggestion Auto-button */}
            <button
              type="button"
              onClick={suggestAutoScheduleSlot}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition-colors"
            >
              Find Next Available Queue Slot (Auto)
            </button>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={scheduling || !scheduledDate || !scheduledTime}
                onClick={confirmSchedule}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Lock in Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Conversion Popup Modal for Guests */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-[440px] bg-white rounded-3xl border border-zinc-200/80 shadow-2xl p-8 overflow-hidden font-urbanist animate-in fade-in zoom-in-95 duration-200">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            {/* Close button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 transition-colors p-1 bg-zinc-50 hover:bg-zinc-100 rounded-full"
              aria-label="Close modal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center mt-3">
              {/* Premium Glow Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-[11px] font-bold text-indigo-600 mb-5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SANDBOX MODE</span>
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                Unlock Full Capabilities
              </h3>
              
              <p className="text-sm text-zinc-500 mt-2.5 max-w-sm leading-relaxed">
                You are playing with a live sandbox demo. Sign in or create a free account to unlock real pipelines and start scheduling and saving your native platform drafts!
              </p>

              {/* Value propositions */}
              <ul className="w-full mt-6 space-y-3.5 text-left bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-zinc-900 block">Connect your newsletter/ blog</strong>
                    <span className="text-[11px] text-zinc-500 leading-normal block">Automatically fetch your newsletter feed.</span>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-zinc-900 block">Post Natively</strong>
                    <span className="text-[11px] text-zinc-500 leading-normal block">Distribute drafts to LinkedIn, X, and Instagram.</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-zinc-900 block">AI Custom Brand Voice</strong>
                    <span className="text-[11px] text-zinc-500 leading-normal block">Persist voice parameters, templates, & banned words.</span>
                  </div>
                </li>
              </ul>

              {/* Actions */}
              <div className="w-full mt-7 flex flex-col gap-3">
                <Link
                  href="/auth/signup"
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 text-sm transition-all shadow-md active:scale-98"
                >
                  Create Free Account
                  <ChevronRight className="w-4 h-4" />
                </Link>
                
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center w-full rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold py-3 text-sm transition-all active:scale-98"
                >
                  Sign In
                </Link>
              </div>

              {/* Close secondary CTA */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="mt-4 text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Keep exploring in sandbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
