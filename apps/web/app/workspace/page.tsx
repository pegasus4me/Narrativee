"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { ScheduledOverview } from "../components/workspace/scheduledOverview";
import {
  ChevronRight,
  Lightbulb,
  Link2,
  CalendarDays,
  Check,
} from "lucide-react";
import { useChannels } from "@/app/hooks/api/useChannels";
import { useSources } from "@/app/hooks/api/useSources";
import { useDraftsQueue } from "@/app/hooks/api/useDrafts";
import { useKnowledgeBase, useSaveKnowledgeBase } from "@/app/hooks/api/useKnowledgeBase";
import { BriefingCards } from "../components/workspace/dashboard/BriefingCards";
import { KnowledgeBaseEditor } from "../components/workspace/knowledge-base/KnowledgeBaseEditor";
import { GuestBanner } from "../components/workspace/shared/GuestBanner";
import { AuthModal } from "../components/workspace/shared/AuthModal";
import { getPlatformLogo } from "../components/workspace/shared/PlatformLogo";
import {
  MOCK_CHANNELS,
  MOCK_SOURCES,
  MOCK_KNOWLEDGE_BASE,
} from "../components/workspace/shared/mockData";
import type { HookItem, TemplateItem } from "@/app/types/api";

const cards = [
  {
    href: "/workspace/create",
    eyebrow: "Step 1",
    title: "Create",
    description: "Pick a synced issue, extract angles, then build platform-shaped drafts.",
    icon: Lightbulb,
    iconClass: "from-primary-100 to-orange-50 ring-primary-200/80 text-primary-800",
  },
  {
    href: "/workspace/channels",
    eyebrow: "Pipeline",
    title: "Connections",
    description: "Substack feed plus LinkedIn, X, and Instagram destinations.",
    icon: Link2,
    iconClass: "from-violet-100 to-indigo-50 ring-violet-200/80 text-violet-800",
  },
  {
    href: "/workspace/post-queue",
    eyebrow: "Pipeline",
    title: "Schedule",
    description: "Spread drafts across the week. Visualize posts inside an interactive calendar grid.",
    icon: CalendarDays,
    iconClass: "from-emerald-100 to-teal-50 ring-emerald-200/80 text-emerald-800",
  },
] as const;

export default function Workspace() {
  const session = authClient.useSession();
  const isGuest = !session.isPending && !session.data?.user;
  const isLoggedIn = !session.isPending && !!session.data?.user;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasDismissedModal, setHasDismissedModal] = useState(false);

  // Server state via TanStack Query
  const { data: channelsData } = useChannels(isLoggedIn);
  const { data: sourcesData } = useSources(isLoggedIn);
  const { data: queueData } = useDraftsQueue(isLoggedIn);
  const { data: kbData, isLoading: kbLoading } = useKnowledgeBase(isLoggedIn);
  const saveKb = useSaveKnowledgeBase();

  // Use mock data for guests, real data for logged-in users
  const channels = isLoggedIn ? (channelsData ?? []) : MOCK_CHANNELS;
  const sources = isLoggedIn ? (sourcesData ?? []) : MOCK_SOURCES;

  const { scheduledCount, publishedCount } = useMemo(() => {
    if (isGuest) return { scheduledCount: 3, publishedCount: 24 };
    const queue = queueData ?? [];
    return {
      scheduledCount: queue.filter((p) => p.status === "scheduled" && p.scheduledAt).length,
      publishedCount: queue.filter((p) => p.status === "published").length,
    };
  }, [isGuest, queueData]);

  // Local knowledge base state for editing
  const [customHooks, setCustomHooks] = useState<HookItem[]>([]);
  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [brandVoiceTraining, setBrandVoiceTraining] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync KB data from query to local state
  useEffect(() => {
    if (isGuest) {
      setCustomHooks(MOCK_KNOWLEDGE_BASE.customHooks);
      setCustomTemplates(MOCK_KNOWLEDGE_BASE.customTemplates);
      setBannedWords(MOCK_KNOWLEDGE_BASE.bannedWords);
      setBrandVoiceTraining(MOCK_KNOWLEDGE_BASE.brandVoiceTraining);
    } else if (kbData) {
      setCustomHooks(kbData.customHooks);
      setCustomTemplates(kbData.customTemplates);
      setBannedWords(kbData.bannedWords);
      setBrandVoiceTraining(kbData.brandVoiceTraining);
    }
  }, [isGuest, kbData]);

  // Guest auth modal timer
  useEffect(() => {
    if (isGuest && !hasDismissedModal) {
      const timer = setTimeout(() => setShowAuthModal(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isGuest, hasDismissedModal]);

  const handleSaveSettings = async () => {
    if (isGuest) {
      setSaving(true);
      setSaveSuccess(false);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowAuthModal(true);
      }, 1000);
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(false);
      await saveKb.mutateAsync({ customHooks, customTemplates, bannedWords, brandVoiceTraining });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      {/* Header */}
      <header className="mb-10 border-b border-zinc-100 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {channels.length > 0 && (
            <div className="flex -space-x-2 overflow-hidden mr-1">
              {channels.map((c, idx) => {
                const fallbackLetter = (c.accountName || c.platform || "?").charAt(0).toUpperCase();
                return (
                  <div
                    key={c.id || idx}
                    title={`${c.platform?.toUpperCase()}: ${c.accountName || ""}`}
                    className="relative inline-block h-12 w-12 rounded-full ring-2 ring-white bg-zinc-100 flex items-center justify-center shadow-sm shrink-0 transition-transform hover:scale-105 hover:z-10"
                  >
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.accountName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-zinc-500">{fallbackLetter}</span>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-200 shadow-xs">
                      <img src={getPlatformLogo(c.platform)} alt={c.platform} className="h-full w-full object-contain" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Hey {session.data?.user?.name || (isGuest ? "Creator" : "there")} 👋
            </h1>
          </div>
        </div>
      </header>

      {isGuest && <GuestBanner />}

      <div className="grid gap-10 xl:grid-cols-[1fr_360px] xl:gap-14 2xl:gap-16 items-start">
        <div className="min-w-0 flex-1 space-y-12">
          <BriefingCards
            sources={sources}
            channels={channels}
            scheduledCount={scheduledCount}
            publishedCount={publishedCount}
          />

          {/* Quick Navigation */}
          <div className="mb-12">
            <h2 className="mb-4 text-md text-black">Quick Navigation</h2>
            <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map(({ href, title, description, icon: Icon, iconClass }) => (
                <li key={href} className="min-w-0">
                  <Link
                    href={href}
                    className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-md sm:p-6"
                  >
                    <div className={`mb-4 flex h-10 w-10 items-center ${iconClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-zinc-900">{title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 opacity-0 transition-opacity group-hover:opacity-100">
                      Open
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <KnowledgeBaseEditor
            customHooks={customHooks}
            customTemplates={customTemplates}
            bannedWords={bannedWords}
            brandVoiceTraining={brandVoiceTraining}
            onChangeHooks={setCustomHooks}
            onChangeTemplates={setCustomTemplates}
            onChangeBannedWords={setBannedWords}
            onChangeBrandVoice={setBrandVoiceTraining}
            onSave={handleSaveSettings}
            saving={saving}
            saveSuccess={saveSuccess}
            loading={kbLoading && isLoggedIn}
          />
        </div>

        <aside className="shrink-0 sticky top-6 xl:justify-self-end w-full max-w-sm xl:max-w-none">
          <ScheduledOverview />
        </aside>
      </div>

      {/* Auth Modal for Guests */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-[440px] bg-white rounded-3xl border border-zinc-200/80 shadow-2xl p-8 overflow-hidden font-urbanist animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <button
              onClick={() => { setShowAuthModal(false); setHasDismissedModal(true); }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 transition-colors p-1 bg-zinc-50 hover:bg-zinc-100 rounded-full"
              aria-label="Close modal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center mt-3">
              <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                Unlock Full Capabilities
              </h3>
              <p className="text-sm text-zinc-500 mt-2.5 max-w-sm leading-relaxed">
                You are playing with a live sandbox demo. Save your brand profile and connect live channels to start repurposing:
              </p>
              <ul className="w-full mt-6 space-y-3.5 text-left bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
                {[
                  { title: "Connect your newsletter/ blog", desc: "Automatically fetch your newsletter feed." },
                  { title: "Post Natively", desc: "Distribute drafts to LinkedIn, X, and Instagram." },
                  { title: "AI Custom Brand Voice", desc: "Persist voice parameters, templates, & banned words." },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-zinc-900 block">{item.title}</strong>
                      <span className="text-[11px] text-zinc-500 leading-normal block">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
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
              <button
                onClick={() => { setShowAuthModal(false); setHasDismissedModal(true); }}
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
