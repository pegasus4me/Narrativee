"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api-config";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  ChevronRight,
  Layers,
  Link2,
  Sparkles,
  Target,
  LayoutGrid,
  Kanban,
  Volume2,
  Zap,
  Rss,
} from "lucide-react";
import { authClient } from "../../../lib/auth-client";
import { useArticles } from "@/app/hooks/api/useArticles";
import { DraftCard } from "@/app/components/workspace/create/DraftCard";
import { AuthModal } from "@/app/components/workspace/shared/AuthModal";
import { ScheduleModal } from "@/app/components/workspace/shared/ScheduleModal";
import { MOCK_ARTICLE, MOCK_DRAFTS } from "@/app/components/workspace/shared/mockData";
import type { Draft } from "@/app/types/api";

interface ArticleItem {
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
  { icon: Link2, title: "Starts from your synced issue", body: "No copy-paste or lost context. We read the same HTML your readers got, tied to your publication." },
  { icon: Target, title: "Angles, not a recap", body: "Each line is one claim, hook, or stat to build from, so posts don't collapse into the same vague summary." },
  { icon: Layers, title: "Built for platform shapes next", body: "LinkedIn spacing, X length, IG caption rhythm - drafts follow how each network rewards structure, not one blob for all." },
  { icon: Volume2, title: "Voice consistency", body: "Trains directly on your past writing style. Your drafts actually sound like you, not a generic robot." },
  { icon: Zap, title: "Native platform structure preservation", body: "Adheres strictly to modern formatting constraints. Posts look perfectly spaced and styled natively for each platform." },
] as const;

const MOCK_ATOMIC_IDEAS: AtomicIdea[] = [
  { idea: "Building a personal brand isn't about being loud, it's about being consistent.", whyInteresting: "Challenges the misconception that virality is required.", targetAudience: "Founders" },
  { idea: "The best newsletters are just public thinking.", whyInteresting: "Lowers the barrier to entry for new creators.", targetAudience: "Creators" },
  { idea: "Stop trying to write for everyone. Pick one person and solve their problem.", whyInteresting: "Actionable advice for niche targeting.", targetAudience: "Marketers" }
];

export interface AtomicIdea {
  idea: string;
  whyInteresting: string;
  targetAudience: string;
}

export default function CreatePage() {
  const session = authClient.useSession();
  const isGuest = !session.isPending && !session.data?.user;
  const isLoggedIn = !session.isPending && !!session.data?.user;

  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: articlesData, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } = useArticles(isLoggedIn);
  const articles: ArticleItem[] = isLoggedIn ? (articlesData ?? []) : [MOCK_ARTICLE as unknown as ArticleItem];

  const [selected, setSelected] = useState<ArticleItem | null>(null);
  const [ideas, setIdeas] = useState<AtomicIdea[]>([]);
  const [contentGoal, setContentGoal] = useState<string>("Growing followers");
  const [patternInsights, setPatternInsights] = useState<string | null>(null);
  const [selectedAngles, setSelectedAngles] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`${API_URL}/articles/insights`, { credentials: 'include' })
      .then(res => res.json())
      .then((data: any) => {
        if (data.insight) setPatternInsights(data.insight);
      })
      .catch(err => console.error('Failed to fetch insights', err));
  }, [isLoggedIn]);

  const [ideasMeta, setIdeasMeta] = useState<{ cached: boolean } | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState("");

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState("");
  const [showDraftsView, setShowDraftsView] = useState(false);
  const [attachLink, setAttachLink] = useState(true);
  const [generateCarousels, setGenerateCarousels] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(new Set());

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingDraftId, setSchedulingDraftId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [savedDraftIds, setSavedDraftIds] = useState<Set<string>>(new Set());
  const [savedDraftIdsPersisted, setSavedDraftIdsPersisted] = useState<Set<string>>(new Set());

  const [latestDraft, setLatestDraft] = useState<{
    article: { id: string; title: string; createdAt: string } | null;
    drafts: Draft[];
  } | null>(null);
  const [activeWorkspaces, setActiveWorkspaces] = useState<{ articleId: string; articleTitle: string; draftCount: number }[]>([]);

  const fetchLatestDraft = useCallback(async () => {
    if (isGuest) { setLatestDraft(null); setActiveWorkspaces([]); return; }
    try {
      const [resLatest, resActive] = await Promise.all([
        fetch(`${API_URL}/articles/drafts/latest`, { credentials: "include" }),
        fetch(`${API_URL}/articles/drafts/active`, { credentials: "include" }),
      ]);
      if (resLatest.ok) {
        const data = (await resLatest.json()) as { article?: { id: string; title: string; createdAt: string }; drafts?: Draft[] };
        setLatestDraft(data.article && data.drafts && data.drafts.length > 0 ? { article: data.article, drafts: data.drafts } : null);
      }
      if (resActive.ok) {
        setActiveWorkspaces((await resActive.json()) as { articleId: string; articleTitle: string; draftCount: number }[]);
      }
    } catch { /* ignore */ }
  }, [isGuest]);

  useEffect(() => { fetchLatestDraft(); }, [fetchLatestDraft]);

  const loadIdeas = async (article: ArticleItem, force: boolean) => {
    setSelected(article);
    setIdeasError("");
    setLoadingIdeas(true);
    setIdeas([]);
    setSelectedAngles(new Set());
    setIdeasMeta(null);
    setDrafts([]);
    setDraftsError("");

    if (isGuest) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIdeas(MOCK_ATOMIC_IDEAS);
      setIdeasMeta({ cached: true });
      setLoadingIdeas(false);
      return;
    }

    try {
      if (!force) {
        const res = await fetch(`${API_URL}/articles/${article.id}`, { credentials: "include" });
        const data = (await res.json()) as { message?: string; error?: string; drafts?: Draft[]; article?: { angles?: string[] } };
        if (!res.ok) throw new Error(data.message || data.error || "Failed to load newsletter details");
        if (data.drafts && data.drafts.length > 0) {
          setDrafts(data.drafts);
          setSavedDraftIdsPersisted(new Set(data.drafts.map((d: Draft) => d.id)));
          setShowDraftsView(true);
          setIdeas((data.article?.angles as unknown as AtomicIdea[]) || []);
          setLoadingIdeas(false);
          return;
        }
        if (data.article?.angles && data.article.angles.length > 0) {
          setIdeas(data.article.angles as unknown as AtomicIdea[]);
          setIdeasMeta({ cached: true });
          setLoadingIdeas(false);
          return;
        }
      }
      const extractRes = await fetch(`${API_URL}/articles/${article.id}/ideas`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force, contentGoal }),
      });
      const extractData = (await extractRes.json()) as { message?: string; error?: string; details?: string; ideas?: string[]; cached?: boolean };
      if (extractRes.status === 402) throw new Error(extractData.message || extractData.error || "Not enough credits");
      if (!extractRes.ok) throw new Error([extractData.error, extractData.message, extractData.details].filter(Boolean).join(" — ") || "Could not extract angles");
      setIdeas((extractData.ideas as unknown as AtomicIdea[]) || []);
      setIdeasMeta({ cached: !!extractData.cached });
    } catch (e: unknown) {
      setIdeasError(e instanceof Error ? e.message : "Failed to load newsletter");
    } finally {
      setLoadingIdeas(false);
    }
  };

  const generateDrafts = async () => {
    if (!selected || selectedAngles.size === 0) return;
    setGeneratingDrafts(true);
    setDraftsError("");

    if (isGuest) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const simulatedDrafts = MOCK_DRAFTS.map((d) => {
        if (attachLink && MOCK_ARTICLE.url) {
          const txt = d.content.text || "";
          return { ...d, content: { ...d.content, text: txt.includes(MOCK_ARTICLE.url!) ? txt : `${txt}\n\nRead the full article: ${MOCK_ARTICLE.url}` } };
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
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedAngles: Array.from(selectedAngles).map((idx) => ideas[idx]), attachLink, generateCarousels }),
      });
      const data = (await res.json()) as { message?: string; error?: string; drafts?: Draft[] };
      if (!res.ok) throw new Error(data.message || data.error || "Failed to generate drafts");
      setDrafts(data.drafts || []);
      setShowDraftsView(true);
    } catch (e: unknown) {
      setDraftsError(e instanceof Error ? e.message : "Failed to generate drafts");
    } finally {
      setGeneratingDrafts(false);
    }
  };

  const handleDraftChange = (id: string, text: string) => {
    const sanitized = text.replace(/\u2014/g, "-").replace(/—/g, "-");
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, content: { ...d.content, text: sanitized } } : d)));
  };

  const saveDraft = async (draftId: string, text: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
    if (!selected) return;
    setSavingDraftId(draftId);
    try {
      const res = await fetch(`${API_URL}/articles/${selected.id}/drafts/${draftId}`, {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { const d = (await res.json()) as { message?: string; error?: string }; throw new Error(d.message || d.error || "Failed to save draft"); }
      setSavedDraftIds((prev) => new Set(prev).add(draftId));
      setSavedDraftIdsPersisted((prev) => new Set(prev).add(draftId));
      setTimeout(() => setSavedDraftIds((prev) => { const n = new Set(prev); n.delete(draftId); return n; }), 2000);
      fetchLatestDraft();
    } catch { /* ignore */ } finally { setSavingDraftId(null); }
  };

  const convertToCarousel = async (draftId: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
    setSavingDraftId(draftId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${draftId}/convert-to-carousel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const d = (await res.json()) as any;
        throw new Error(d.message || d.error || "Failed to convert draft");
      }
      const data = (await res.json()) as any;
      if (data.success && data.draft) {
        setDrafts((prev) => prev.map((d) => (d.id === draftId ? data.draft : d)));
      }
    } catch (e: any) {
      alert(e.message || "Failed to convert draft to carousel");
    } finally {
      setSavingDraftId(null);
    }
  };

  const refreshCarouselBg = async (draftId: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
    setSavingDraftId(draftId);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${draftId}/refresh-carousel-bg`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aspectRatio: "4:5" }),
      });
      if (!res.ok) {
        const d = (await res.json()) as any;
        throw new Error(d.message || d.error || "Failed to refresh background");
      }
      const data = (await res.json()) as any;
      if (data.success && data.draft) {
        // Find existing draft to keep channel details intact
        const existingDraft = drafts.find((d) => d.id === draftId);
        const updatedDraft = {
          ...data.draft,
          channel: existingDraft?.channel,
        };
        setDrafts((prev) => prev.map((d) => (d.id === draftId ? updatedDraft : d)));
      }
    } catch (e: any) {
      alert(e.message || "Failed to refresh carousel background");
    } finally {
      setSavingDraftId(null);
    }
  };

  const openScheduleModal = (draftId: string) => {
    if (isGuest) { setShowAuthModal(true); return; }
    setSchedulingDraftId(draftId);
    setIsScheduleModalOpen(true);
  };

  const confirmSchedule = async (scheduledAt: string) => {
    if (!schedulingDraftId) return;
    setScheduling(true);
    try {
      const res = await fetch(`${API_URL}/articles/drafts/${schedulingDraftId}/schedule`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      if (res.ok) {
        setScheduledIds((prev) => new Set(prev).add(schedulingDraftId));
        setDrafts((prev) => prev.map((d) => (d.id === schedulingDraftId ? { ...d, status: "scheduled", scheduledAt } : d)));
        setIsScheduleModalOpen(false);
        setSchedulingDraftId(null);
      }
    } catch { /* ignore */ } finally { setScheduling(false); }
  };

  const resumeLatestDraft = () => {
    if (!latestDraft?.article) return;
    setSelected(latestDraft.article as unknown as ArticleItem);
    setDrafts(latestDraft.drafts);
    setSavedDraftIdsPersisted(new Set(latestDraft.drafts.map((d) => d.id)));
    setShowDraftsView(true);
  };

  const toggleAngle = (index: number) => {
    setSelectedAngles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const platformOrder = ["linkedin", "x", "threads", "instagram"];
  const sortedDrafts = [...drafts].sort((a, b) => {
    const oA = platformOrder.indexOf(a.channel.platform);
    const oB = platformOrder.indexOf(b.channel.platform);
    return (oA === -1 ? 99 : oA) - (oB === -1 ? 99 : oB);
  });

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-6 border-b border-zinc-100 pb-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl lg:max-w-none lg:flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Create</h1>
        </div>
        <nav className="flex shrink-0 flex-wrap gap-1 rounded-xl bg-zinc-100/90 p-1 text-xs font-medium text-zinc-500" aria-label="Repurpose steps">
          <Link href="/workspace/channels" className="rounded-lg px-3 py-2 transition-colors hover:bg-white/80 hover:text-zinc-800">Connect</Link>
          <button type="button" disabled={!selected} onClick={() => setShowDraftsView(false)} className={`rounded-lg px-3 py-2 transition-colors hover:text-zinc-800 ${!showDraftsView && selected ? "bg-white text-zinc-900 font-semibold" : "hover:bg-white/80"}`}>Angles</button>
          <span className={`rounded-lg px-3 py-2 ${showDraftsView ? "bg-white text-zinc-900 font-semibold" : "opacity-50"}`}>Drafts</span>
          <Link href="/workspace/post-queue" className="rounded-lg px-3 py-2 transition-colors hover:bg-white/80 hover:text-zinc-800">Queue</Link>
        </nav>
      </header>

      {/* Drafts View */}
      {showDraftsView ? (
        <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button type="button" onClick={() => setShowDraftsView(false)} className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900">
            <ArrowLeft className="h-4 w-4" /> Back to angles
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Platform Native Drafts</h2>
              <p className="mt-1 text-sm text-zinc-500">Customize or tweak what drafted for your channels before sending them to the pipeline.</p>
            </div>
            <div className="inline-flex shrink-0 items-center rounded-xl bg-zinc-100 p-1 text-xs font-medium text-zinc-500 self-start sm:self-center">
              <button type="button" onClick={() => setViewMode("grid")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${viewMode === "grid" ? "bg-white text-zinc-900" : "hover:text-zinc-800"}`}>
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
              <button type="button" onClick={() => setViewMode("kanban")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${viewMode === "kanban" ? "bg-white text-zinc-900" : "hover:text-zinc-800"}`}>
                <Kanban className="h-3.5 w-3.5" /> Kanban
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  isScheduled={scheduledIds.has(draft.id) || draft.status === "scheduled"}
                  isSaving={savingDraftId === draft.id}
                  isSaved={savedDraftIds.has(draft.id)}
                  onDraftChange={handleDraftChange}
                  onCopy={() => { }}
                  onSave={saveDraft}
                  onSchedule={openScheduleModal}
                  onConvertToCarousel={convertToCarousel}
                  onRefreshCarouselBg={refreshCarouselBg}
                />
              ))}
            </div>
          ) : (
            <KanbanView
              drafts={drafts}
              scheduledIds={scheduledIds}
              savingDraftId={savingDraftId}
              savedDraftIds={savedDraftIds}
              onDraftChange={handleDraftChange}
              onSave={saveDraft}
              onSchedule={openScheduleModal}
              onConvertToCarousel={convertToCarousel}
              onRefreshCarouselBg={refreshCarouselBg}
            />
          )}
        </div>
      ) : selected ? (
        /* Angles View */
        <div className="min-w-0 space-y-8">
          <button
            type="button"
            onClick={() => { setSelected(null); setIdeas([]); setIdeasError(""); setIdeasMeta(null); setSelectedAngles(new Set()); refetchArticles(); }}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" /> All issues
          </button>

          <div className="grid min-w-0 gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="rounded-2xl bg-zinc-50/80 p-5 lg:sticky lg:top-6">
                <p className="text-[10px] font-light text-black">Selected newsletter</p>
                <a href={selected.url || ""} target="_blank" rel="noopener noreferrer" className="mt-2 text-base font-semibold leading-snug text-black/60 underline underline-offset-2 decoration-dotted hover:text-black">
                  {selected.title}
                </a>
                <p className="mt-2 text-xs text-zinc-500">{selected.publishedAt ? new Date(selected.publishedAt).toLocaleString() : ""}</p>
                <div className="mt-5 flex flex-col gap-2">
                  <button type="button" disabled={loadingIdeas} onClick={() => loadIdeas(selected, false)} className="w-full rounded-xl bg-white px-3 py-2.5 text-left text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50">Reload saved angles</button>
                  <button type="button" disabled={loadingIdeas} onClick={() => { if (!confirm("Re-run extraction? Uses 1 credit and replaces saved angles for this issue.")) return; loadIdeas(selected, true); }} className="inline-flex w-full items-center justify-center gap-2 text-white rounded-xl bg-primary px-3 py-2.5 text-xs font-medium transition-colors hover:bg-primary/80 disabled:opacity-50">
                    <RefreshCw className="h-3.5 w-3.5" /> Re-extract (1 credit)
                  </button>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-8 xl:col-span-9">
              {ideasError && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{ideasError}</div>}

              {loadingIdeas && (
                <div className="flex flex-col items-start gap-3 rounded-2xl bg-zinc-50/80 px-6 py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Pulling angles from your issue...</p>
                    <p className="mt-1 max-w-lg text-xs text-zinc-600">We look for standalone hooks and claims—not a single recap—so each line can become its own post.</p>
                  </div>
                </div>
              )}

              {!loadingIdeas && ideas.length > 0 && (
                <div>
                  <div className="mb-5 flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">Choose your angles</h3>
                      <p className="mt-1 max-w-2xl text-sm text-zinc-600">Select one or more. Next step turns each into drafts that match how LinkedIn, X, and Instagram actually read.</p>
                    </div>
                    {ideasMeta?.cached && <span className="shrink-0 self-start rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-800">Cached · no credit</span>}
                  </div>

                  {/* Content Goal Selector */}
                  <div className="mb-6 flex flex-col gap-2 rounded-xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                    <label className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Current Goal</label>
                    <select
                      value={contentGoal}
                      onChange={(e) => setContentGoal(e.target.value)}
                      className="w-full sm:w-64 rounded-lg border-indigo-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="Growing followers">Grow Followers (Hook-heavy/Provocative)</option>
                      <option value="Building authority">Build Authority (Deep insights/Nuance)</option>
                      <option value="Driving signups">Drive Signups (CTA-driven/Valuable)</option>
                    </select>
                  </div>

                  {/* Pattern Insights Banner */}
                  {patternInsights && (
                    <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-600">✨</span>
                        <h4 className="text-sm font-bold text-amber-900">Pattern Detected</h4>
                      </div>
                      <p className="text-sm text-amber-800">{patternInsights}</p>
                    </div>
                  )}

                  <ul className="grid min-w-0 gap-3 md:grid-cols-2">
                    {ideas.map((idea, i) => {
                      const on = selectedAngles.has(i);
                      return (
                        <li key={i} className="min-w-0">
                          <button type="button" onClick={() => toggleAngle(i)} className={`flex h-full min-h-[5.5rem] w-full flex-col rounded-2xl p-4 text-left text-sm leading-relaxed transition-colors ${on ? "bg-primary-50 text-zinc-900" : "bg-zinc-50/80 text-zinc-800 hover:bg-zinc-100/80"}`}>
                            <span className="mb-2 text-[10px] font-bold text-zinc-400">Angle {i + 1}</span>
                            <span className="text-[15px] leading-snug">{idea.idea}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {draftsError && <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{draftsError}</div>}

                  <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-zinc-100/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-700">
                      <strong className="font-medium text-zinc-900">{selectedAngles.size > 0 ? `${selectedAngles.size} selected` : "Nothing selected yet"}</strong>
                      {selectedAngles.size > 0 ? " — ready to generate your native platform drafts." : " — tap the cards you want to turn into posts."}
                    </p>
                    {selectedAngles.size > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                          <input type="checkbox" checked={attachLink} onChange={(e) => setAttachLink(e.target.checked)} className="h-4.5 w-4.5 rounded-md border-zinc-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-colors" />
                          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">Attach original article link</span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                          <input type="checkbox" checked={generateCarousels} onChange={(e) => setGenerateCarousels(e.target.checked)} className="h-4.5 w-4.5 rounded-md border-zinc-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-colors" />
                          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors inline-flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-100" />
                            Generate LI/IG drafts as Carousels
                          </span>
                        </label>
                        <button type="button" disabled={generatingDrafts} onClick={generateDrafts} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-light text-white transition-colors hover:bg-primary/80 disabled:opacity-50 shrink-0">
                          {generatingDrafts ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting posts...</>) : "Generate Drafts"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Articles List */
        <div className="grid min-w-0 gap-10 xl:grid-cols-[1fr_minmax(280px,360px)] xl:gap-14 2xl:gap-16">
          <section className="min-w-0 space-y-8">
            {/* Latest draft resume card */}
            {latestDraft?.article && (
              <div className="rounded-2xl border border-zinc-200/60 bg-zinc-50/50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-indigo-600">Resume latest workspace</span>
                  <p className="text-sm font-medium text-zinc-900 truncate mt-0.5">{latestDraft.article.title}</p>
                  <p className="text-[10px] text-zinc-500">{latestDraft.drafts.length} draft{latestDraft.drafts.length !== 1 ? "s" : ""} saved</p>
                </div>
                <button type="button" onClick={resumeLatestDraft} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shrink-0">Resume <ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* Active workspaces */}
            {activeWorkspaces.length > 1 && (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {activeWorkspaces.map((ws) => (
                  <button key={ws.articleId} type="button" onClick={() => { const a = articles.find((ar) => ar.id === ws.articleId); if (a) loadIdeas(a, false); }} className="flex flex-col rounded-xl bg-zinc-50/80 p-3 text-left text-xs hover:bg-zinc-100/80 transition-colors">
                    <span className="text-[9px] font-semibold text-indigo-600 uppercase mb-1">Active workspace</span>
                    <span className="text-zinc-900 font-medium truncate">{ws.articleTitle}</span>
                    <span className="text-zinc-500 mt-0.5">{ws.draftCount} draft{ws.draftCount !== 1 ? "s" : ""}</span>
                  </button>
                ))}
              </div>
            )}

            {articlesLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mb-3 text-zinc-600" />
                <p className="text-sm">Syncing newsletter feed...</p>
              </div>
            ) : articlesError ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-3 text-center">
                <p className="text-sm font-medium text-red-600">{articlesError instanceof Error ? articlesError.message : "Failed to load articles"}</p>
                <button type="button" onClick={() => refetchArticles()} className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-800"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl px-8 py-16 text-center bg-zinc-50/80">
                <Rss className="h-7 w-7 text-zinc-400 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-900">No articles found</h3>
                <p className="mt-2 max-w-xs text-sm text-zinc-500">Connect a Substack or blog to fetch your newsletter issues.</p>
                <Link href="/workspace/channels" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">Go to Channels <ChevronRight className="h-4 w-4" /></Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Pick an Issue</h2>
                  <button type="button" onClick={() => refetchArticles()} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 shrink-0">
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>
                <ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {articles.map((a) => (
                    <li key={a.id} className="min-w-0">
                      <button type="button" onClick={() => loadIdeas(a, false)} className="group relative flex h-full w-full flex-col rounded-2xl bg-zinc-50/80 p-4 text-left transition-colors hover:bg-zinc-100/80">
                        <p className="line-clamp-3 text-sm font-medium leading-snug text-zinc-900 group-hover:text-zinc-950">{a.title}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                          <span>{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Date unknown"}</span>
                          {a.angleCount > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">{a.angleCount} angles saved</span>}
                          {(a.draftCount ?? 0) > 0 && (
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-800 inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                              {a.draftCount} drafts active
                            </span>
                          )}
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-black opacity-0 transition-opacity group-hover:opacity-100">
                          {(a.draftCount ?? 0) > 0 ? "Resume active workspace" : "Extract angles"} <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                        {a.sourcePlatform === "substack" && (
                          <div className="absolute bottom-4 right-4 flex h-5 w-5 items-center justify-center rounded-md bg-white p-1 shadow-2xs border border-zinc-100/80 transition-opacity group-hover:opacity-20">
                            <img src="https://cdn.worldvectorlogo.com/logos/substack-1.svg" alt="Substack" className="h-full w-full object-contain" />
                          </div>
                        )}
                        {a.sourcePlatform === "custom_rss" && (
                          <div className="absolute bottom-4 right-4 flex h-5 w-5 items-center justify-center rounded-md bg-orange-500 p-1 shadow-2xs border border-orange-600/80 transition-opacity group-hover:opacity-20 text-white">
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

          <aside className="min-w-0 xl:max-w-md xl:justify-self-end">
            <div className="sticky top-6 rounded-2xl bg-gradient-to-b from-zinc-50 to-white p-6">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-black font-light" />
                <h3 className="text-sm font-semibold text-zinc-900">Why not just ChatGPT?</h3>
              </div>
              <ul className="space-y-5">
                {VS_CHATGPT.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white"><Icon className="h-4 w-4 text-zinc-600" /></div>
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
      )}

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onConfirm={confirmSchedule}
        isSubmitting={scheduling}
      />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

interface KanbanViewProps {
  drafts: Draft[];
  scheduledIds: Set<string>;
  savingDraftId: string | null;
  savedDraftIds: Set<string>;
  onDraftChange: (id: string, text: string) => void;
  onSave: (id: string, text: string) => void;
  onSchedule: (id: string) => void;
  onConvertToCarousel?: (id: string) => void;
  onRefreshCarouselBg?: (id: string) => void;
}

function KanbanView({ drafts, scheduledIds, savingDraftId, savedDraftIds, onDraftChange, onSave, onSchedule, onConvertToCarousel, onRefreshCarouselBg }: KanbanViewProps) {
  const columns = [
    { key: "draft", label: "Draft", desc: "Newly generated or approved content" },
    { key: "scheduled", label: "Scheduled", desc: "Posts queued in the dispatch timeline" },
    { key: "published", label: "Published", desc: "Sent or completed social posts" },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full pb-6">
      {columns.map(({ key, label, desc }) => {
        let columnDrafts: Draft[];
        if (key === "published") columnDrafts = drafts.filter((d) => d.status === "published");
        else if (key === "scheduled") columnDrafts = drafts.filter((d) => (scheduledIds.has(d.id) || d.status === "scheduled") && d.status !== "published");
        else columnDrafts = drafts.filter((d) => !scheduledIds.has(d.id) && d.status !== "scheduled" && d.status !== "published");

        return (
          <div key={key} className="flex flex-col gap-4 flex-1 min-w-[280px] rounded-2xl bg-zinc-50 p-4">
            <div className="flex flex-col gap-1 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-900 leading-none">{label}</span>
                <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-700">{columnDrafts.length}</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-light mt-0.5">{desc}</span>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
              {columnDrafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-white/40">
                  <p className="text-[11px] font-medium text-zinc-400">No {label.toLowerCase()} posts</p>
                </div>
              ) : (
                columnDrafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    isScheduled={scheduledIds.has(draft.id) || draft.status === "scheduled"}
                    isSaving={savingDraftId === draft.id}
                    isSaved={savedDraftIds.has(draft.id)}
                    onDraftChange={onDraftChange}
                    onCopy={() => { }}
                    onSave={onSave}
                    onSchedule={onSchedule}
                    onConvertToCarousel={onConvertToCarousel}
                    onRefreshCarouselBg={onRefreshCarouselBg}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
