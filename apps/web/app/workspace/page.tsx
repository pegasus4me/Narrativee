"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import { ScheduledOverview } from "../components/workspace/scheduledOverview";
import { LINKEDIN_LOGO, X_LOGO, FACEBOOK_LOGO, THREADS_LOGO, INSTAGRAM_LOGO } from "@/app/constants";
import {
  ChevronRight,
  Home,
  Lightbulb,
  Link2,
  CalendarDays,
  Sparkles,
  Ban,
  Plus,
  Trash2,
  Check,
  Loader2,
  BookOpen,
  HelpCircle,
  BrainCircuit,
  Settings
} from "lucide-react";

import { API_URL } from "@/lib/api-config";

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

const MOCK_SOURCES = [
  { id: "mock-s1", url: "https://creators.substack.com/feed" }
];

const MOCK_CHANNELS = [
  { id: "mock-c1", platform: "linkedin", accountName: "Sarah Chen (Founder)", avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg" },
  { id: "mock-c2", platform: "x", accountName: "sarah_growth", avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg" },
  { id: "mock-c3", platform: "threads", accountName: "sarah_chen", avatarUrl: "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg" }
];

const MOCK_HOOKS = [
  { channel: "linkedin", hook: "I spent 30 hours analyzing why some newsletters go viral. Here is the formula:" },
  { channel: "x", hook: "90% of content repurposing is waste. Here is how to do it natively in 3 steps:" },
  { channel: "threads", hook: "The best newsletter creators don't rewrite. They translate. Here is how:" }
];

const MOCK_TEMPLATES = [
  {
    channel: "linkedin",
    template: "🚀 [Viral Hook Line]\n\nHere is the breakdown:\n• [Key Insight 1]\n• [Key Insight 2]\n\n💡 Actionable Takeaway: [Practical Blueprint]\n\nFollow me for more daily content guides."
  }
];

const MOCK_BANNED_WORDS = ["delve", "synergy", "testament", "tapestry"];
const MOCK_BRAND_VOICE = "Write in crisp, punchy, actionable sentences.\nUse bullet points and double line breaks for high scannability.\nAvoid AI buzzwords like 'delve' or 'revolutionize'.\nEmulate a transparent, practitioner-first builder voice.";

export default function Workspace() {
  const session = authClient.useSession();
  const isGuest = !session.isPending && !session.data?.user;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasDismissedModal, setHasDismissedModal] = useState(false);

  // Briefing statistics states
  const [channelsList, setChannelsList] = useState<any[]>([]);
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);

  // Knowledge Base State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [customHooks, setCustomHooks] = useState<{ channel: string; hook: string }[]>([]);
  const [customTemplates, setCustomTemplates] = useState<{ channel: string; template: string }[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [brandVoiceTraining, setBrandVoiceTraining] = useState("");

  const [activeSettingsTab, setActiveSettingsTab] = useState<"voice" | "hooks" | "templates" | "banned">("voice");

  // Input states
  const [selectedChannel, setSelectedChannel] = useState("linkedin");
  const [newHook, setNewHook] = useState("");
  const [newTemplate, setNewTemplate] = useState("");
  const [newBannedWord, setNewBannedWord] = useState("");

  // Platform metadata
  const platformLabels = {
    linkedin: "LinkedIn",
    x: "X (Twitter)",
    instagram: "Instagram",
    threads: "Threads",
  };

  useEffect(() => {
    if (!session.isPending) {
      if (isGuest) {
        setSourcesList(MOCK_SOURCES);
        setChannelsList(MOCK_CHANNELS);
        setScheduledCount(3);
        setPublishedCount(24);
        setCustomHooks(MOCK_HOOKS);
        setCustomTemplates(MOCK_TEMPLATES);
        setBannedWords(MOCK_BANNED_WORDS);
        setBrandVoiceTraining(MOCK_BRAND_VOICE);
        setLoading(false);
      } else {
        fetchSettings();
        fetchBriefing();
      }
    }
  }, [session.isPending, isGuest]);

  useEffect(() => {
    if (isGuest && !hasDismissedModal) {
      const timer = setTimeout(() => {
        setShowAuthModal(true);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isGuest, hasDismissedModal]);

  const fetchBriefing = async () => {
    try {
      const [channelsRes, sourcesRes, queueRes] = await Promise.all([
        fetch(`${API_URL}/channels`, { credentials: "include" }),
        fetch(`${API_URL}/sources`, { credentials: "include" }),
        fetch(`${API_URL}/articles/drafts/queue`, { credentials: "include" }),
      ]);

      if (channelsRes.ok) {
        const data = (await channelsRes.json()) as any;
        setChannelsList(data.channels || []);
      }
      if (sourcesRes.ok) {
        const data = (await sourcesRes.json()) as any;
        setSourcesList(data.sources || []);
      }
      if (queueRes.ok) {
        const data = (await queueRes.json()) as any[];
        const scheduled = data.filter((p: any) => p.status === "scheduled" && p.scheduledAt);
        const published = data.filter((p: any) => p.status === "published");
        setScheduledCount(scheduled.length);
        setPublishedCount(published.length);
      }
    } catch (error) {
      console.error("Failed to load dashboard briefing statistics:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/knowledge-base`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as any;
        setCustomHooks(data.customHooks || []);
        setCustomTemplates(data.customTemplates || []);
        setBannedWords(data.bannedWords || []);
        setBrandVoiceTraining(data.brandVoiceTraining || "");
      }
    } catch (error) {
      console.error("Failed to load knowledge base settings:", error);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await fetch(`${API_URL}/knowledge-base`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customHooks,
          customTemplates,
          bannedWords,
          brandVoiceTraining,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  // Helpers
  const addHook = () => {
    if (!newHook.trim()) return;
    setCustomHooks((prev) => [...prev, { channel: selectedChannel, hook: newHook.trim() }]);
    setNewHook("");
  };

  const removeHook = (index: number) => {
    setCustomHooks((prev) => prev.filter((_, i) => i !== index));
  };

  const addTemplate = () => {
    if (!newTemplate.trim()) return;
    setCustomTemplates((prev) => [...prev, { channel: selectedChannel, template: newTemplate.trim() }]);
    setNewTemplate("");
  };

  const removeTemplate = (index: number) => {
    setCustomTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  const addBannedWord = () => {
    if (!newBannedWord.trim()) return;
    const word = newBannedWord.trim().toLowerCase();
    if (!bannedWords.includes(word)) {
      setBannedWords((prev) => [...prev, word]);
    }
    setNewBannedWord("");
  };

  const removeBannedWord = (word: string) => {
    setBannedWords((prev) => prev.filter((w) => w !== word));
  };

  const addPresetWord = (word: string) => {
    if (!bannedWords.includes(word)) {
      setBannedWords((prev) => [...prev, word]);
    }
  };

  return (
    <div className="w-full min-w-0 px-5 py-8 sm:px-8 md:px-10 lg:px-12 xl:px-14">
      {/* Header section */}
      <header className="mb-10 border-b border-zinc-100 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {channelsList.length > 0 && (
            <div className="flex -space-x-2 overflow-hidden mr-1">
              {channelsList.map((c, idx) => {
                const logoUrl =
                  c.platform === "linkedin"
                    ? LINKEDIN_LOGO
                    : c.platform === "x"
                    ? X_LOGO
                    : c.platform === "facebook"
                    ? FACEBOOK_LOGO
                    : c.platform === "threads"
                    ? THREADS_LOGO
                    : INSTAGRAM_LOGO;

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
                      <img src={logoUrl} alt={c.platform} className="h-full w-full object-contain" />
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

      {/* Guest Sandbox Banner */}
      {isGuest && (
        <div className="mb-8 rounded-2xl border border-indigo-500/20 bg-primary/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-urbanist animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div>
              <strong className="text-sm font-bold text-zinc-900 block">Workspace Sandbox Mode</strong>
              <span className="text-xs text-zinc-500 block mt-0.5">You are playing with a live sandbox demo. Sign in or create a free account to unlock real pipelines!</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs shrink-0"
            >
              Sign Up Free
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 text-xs font-bold transition-all shrink-0"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-10 xl:grid-cols-[1fr_360px] xl:gap-14 2xl:gap-16 items-start">
        {/* Left column: Main content */}
        <div className="min-w-0 flex-1 space-y-12">

          {/* Dynamic Activity Briefing Dashboard */}
          <div>
        <h2 className="mb-4 text-md   text-black">Workspace Activity Briefing</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Synced Sources Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block">Content Sources</span>
              <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{sourcesList.length}</strong>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                {sourcesList.length > 0 ? (
                  <span className="flex items-center gap-1.5 text-zinc-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Substack publications synced
                  </span>
                ) : (
                  <span className="text-zinc-400">No newsletters connected yet</span>
                )}
              </div>
            </div>
            {sourcesList.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-zinc-50">
                {sourcesList.map((s, idx) => (
                  <span key={s.id || idx} className="inline-flex items-center gap-1 rounded-md bg-orange-50 border border-orange-100 text-orange-700 text-[9px] font-semibold px-2 py-0.5">
                    {s.url ? s.url.replace("https://", "").replace("/feed", "") : "Substack Newsletter"}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Connected Channels Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block">Connected Channels</span>
              <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{channelsList.length}</strong>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                {channelsList.length > 0 ? (
                  <span className="flex items-center gap-1.5 text-zinc-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    Active social connection pipelines
                  </span>
                ) : (
                  <span className="text-zinc-400">No destination channels connected</span>
                )}
              </div>
            </div>
            {channelsList.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-50">
                {channelsList.map((c, idx) => {
                  const logoUrl =
                    c.platform === "linkedin"
                      ? LINKEDIN_LOGO
                      : c.platform === "x"
                      ? X_LOGO
                      : c.platform === "facebook"
                      ? FACEBOOK_LOGO
                      : c.platform === "threads"
                      ? THREADS_LOGO
                      : INSTAGRAM_LOGO;

                  return (
                    <div
                      key={c.id || idx}
                      title={`${c.platform?.toUpperCase()}: ${c.accountName || ""}`}
                      className="relative h-6 w-6 rounded-md overflow-hidden bg-zinc-50 border border-zinc-200/80 flex items-center justify-center p-1 shrink-0 shadow-2xs hover:scale-110 transition-all cursor-default"
                    >
                      <img src={logoUrl} alt={c.platform} className="h-full w-full object-contain" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scheduled Posts Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-zinc-400  block">Scheduled Posts</span>
              <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{scheduledCount}</strong>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                {scheduledCount > 0 ? (
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

          {/* Published Posts Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-zinc-400  block">Published Posts</span>
              <strong className="text-3xl font-extrabold text-zinc-800 block mt-2">{publishedCount}</strong>
              <div className="mt-2 text-xs text-zinc-500 font-medium">
                {publishedCount > 0 ? (
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
        </div>
      </div>

      {/* Navigation shortcuts grid */}
      <div className="mb-12">
        <h2 className="mb-4 text-md  text-black">Quick Navigation</h2>
        <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ href, eyebrow, title, description, icon: Icon, iconClass }) => (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-md sm:p-6"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center ${iconClass}`}
                >
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

      {/* Brand Knowledge Base Dashboard */}
      <section className=" overflow-hidden">
        {/* Section Header */}
        <div className="border-b border-zinc-100 bg-linear-to-b from-zinc-50/50 to-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Knowledge Base</h3>
            </div>
          </div>

          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSaveSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 shrink-0 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving Changes...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Changes Saved!
              </>
            ) : (
              <>
                <Settings className="h-3.5 w-3.5" />
                Save Brand Profile
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-600" />
            <p className="mt-2 text-xs">Loading your custom brand preferences…</p>
          </div>
        ) : (
          <div className="grid min-w-0 md:grid-cols-[220px_1fr] divide-y md:divide-y-0 md:divide-x divide-zinc-100">
            {/* Left tab sidebar */}
            <div className="p-4 bg-zinc-50/40 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
              <button
                type="button"
                onClick={() => setActiveSettingsTab("voice")}
                className={`w-full rounded-xl px-3.5 py-3 text-xs font-semibold transition-all text-left whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeSettingsTab === "voice"
                    ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                <span>Agent Brand Voice</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab("hooks")}
                className={`w-full rounded-xl px-3.5 py-3 text-xs font-semibold transition-all text-left whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeSettingsTab === "hooks"
                    ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                <span>Custom Hooks</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab("templates")}
                className={`w-full rounded-xl px-3.5 py-3 text-xs font-semibold transition-all text-left whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeSettingsTab === "templates"
                    ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                <span>Custom Templates</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab("banned")}
                className={`w-full rounded-xl px-3.5 py-3 text-xs font-semibold transition-all text-left whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeSettingsTab === "banned"
                    ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                <span>Banned Words</span>
              </button>
            </div>

            {/* Right content panel */}
            <div className="p-6 sm:p-8 min-w-0">
              {/* Tab 1: Agent Brand Voice */}
              {activeSettingsTab === "voice" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Custom Brand Voice Guidelines</h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Upload style sheets, successful newsletters, viral hooks, or tone training narratives.
                    </p>
                  </div>

                  <textarea
                    value={brandVoiceTraining}
                    onChange={(e) => setBrandVoiceTraining(e.target.value)}
                    placeholder="Example tone guide:&#10;- Write in dense, highly punchy, actionable sentences.&#10;- Use double line breaks between sentences for maximum scannability.&#10;- Avoid corporate jargon, instead use raw and transparent language.&#10;- Emulate this exact style: 'I spent 40 hours reading about X so you don't have to. Here's what I learned...'"
                    className="w-full h-80 rounded-xl border border-zinc-200 bg-white p-4 text-xs leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal"
                  />

                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 flex gap-3">
                    <HelpCircle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      <strong>Pro tip:</strong> Paste one of your high-performing articles or tweets in full, and prefix it with <em>"Write exactly in this person's voice, formatting structure, vocabulary style, and tone:"</em>.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Custom Hooks */}
              {activeSettingsTab === "hooks" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Upload Custom Hooks</h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Provide customized hook formulas for specific social platforms to ensure your generated posts grab attention.
                    </p>
                  </div>

                  {/* Add Hook Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white text-zinc-800 font-semibold focus:outline-none"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="x">X</option>
                      <option value="threads">Threads</option>
                      <option value="instagram">Instagram</option>
                    </select>

                    <input
                      type="text"
                      value={newHook}
                      onChange={(e) => setNewHook(e.target.value)}
                      placeholder="e.g. Most people think [Topic] is easy. Here is why they are wrong:"
                      className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={addHook}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Hook
                    </button>
                  </div>

                  {/* Hook List */}
                  <div className="flex flex-col gap-3">
                    <h5 className="text-[11px] font-bold  text-zinc-400 mt-2">Active Hooks</h5>
                    {customHooks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-zinc-50/10">
                        <p className="text-xs text-zinc-400">No custom hooks added.</p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {customHooks.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 p-3 bg-white hover:border-zinc-200 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-bold text-zinc-600 uppercase shrink-0 mt-0.5">
                                {platformLabels[item.channel as keyof typeof platformLabels] || item.channel}
                              </span>
                              <p className="text-xs text-zinc-800 font-normal truncate">{item.hook}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeHook(idx)}
                              className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Custom Templates */}
              {activeSettingsTab === "templates" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Upload Custom Post Templates</h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Define specific vertical structures or line breaks layout for platform-native output.
                    </p>
                  </div>

                  {/* Add Template Controls */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white text-zinc-800 font-semibold focus:outline-none"
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="x">X (Twitter)</option>
                        <option value="threads">Threads</option>
                        <option value="instagram">Instagram</option>
                      </select>
                      <span className="text-xs text-zinc-400">Define the block layout for this platform below:</span>
                    </div>

                    <textarea
                      value={newTemplate}
                      onChange={(e) => setNewTemplate(e.target.value)}
                      placeholder="e.g.&#10;[Bold Claim Hook Line]&#10;&#10;Why this happens: [Core Angle Detail]&#10;&#10;⚡ [Step 1 Takeaway]&#10;💡 [Actionable Blueprint]&#10;&#10;What do you think? Let's discuss."
                      className="w-full h-36 rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addTemplate}
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Template
                      </button>
                    </div>
                  </div>

                  {/* Template List */}
                  <div className="flex flex-col gap-3">
                    <h5 className="text-[11px] font-bold  text-zinc-400 mt-2">Active Templates</h5>
                    {customTemplates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-zinc-50/10">
                        <p className="text-xs text-zinc-400">No custom templates defined.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {customTemplates.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-100 p-4 bg-white hover:border-zinc-200 transition-colors"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-bold text-zinc-600 uppercase">
                                {platformLabels[item.channel as keyof typeof platformLabels] || item.channel}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeTemplate(idx)}
                                className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <pre className="text-[11px] text-zinc-800 font-normal font-sans whitespace-pre-wrap leading-relaxed">
                              {item.template}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Banned Words */}
              {activeSettingsTab === "banned" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Ban Words & Phrases</h4>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Tell the social media agent to strictly avoid generic words, clichés, or specific terms you dislike.
                    </p>
                  </div>

                  {/* Add Word Controls */}
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={newBannedWord}
                      onChange={(e) => setNewBannedWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addBannedWord();
                        }
                      }}
                      placeholder="e.g. delve"
                      className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={addBannedWord}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ban Word
                    </button>
                  </div>

                  {/* Curated Presets */}
                  <div>
                    <h5 className="text-[10px] font-bold  text-zinc-400 mb-2">Curated Cliché Banishments (Click to add)</h5>
                    <div className="flex flex-wrap gap-2">
                      {["delve", "testament", "tapestry", "revolutionize", "beacon", "in today's world", "synergy"].map((w) => (
                        <button
                          type="button"
                          key={w}
                          onClick={() => addPresetWord(w)}
                          disabled={bannedWords.includes(w)}
                          className="rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-40"
                        >
                          + {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active List */}
                  <div className="flex flex-col gap-3 mt-2">
                    <h5 className="text-[11px] font-bold  text-zinc-400">Currently Prohibited Vocabulary</h5>
                    {bannedWords.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-zinc-50/10">
                        <p className="text-xs text-zinc-400">No banned words declared.</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bannedWords.map((word) => (
                          <div
                            key={word}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 shadow-2xs"
                          >
                            <span>{word}</span>
                            <button
                              type="button"
                              onClick={() => removeBannedWord(word)}
                              className="text-rose-500 hover:text-rose-900 transition-colors rounded-full"
                            >
                              <Plus className="h-3 w-3 rotate-45" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      </div>

      {/* Right column: Quick Schedule Overview */}
      <aside className="shrink-0 sticky top-6 xl:justify-self-end w-full max-w-sm xl:max-w-none">
        <ScheduledOverview />
      </aside>

      </div>

      {/* Premium Conversion Popup Modal for Guests */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-[440px] bg-white rounded-3xl border border-zinc-200/80 shadow-2xl p-8 overflow-hidden font-urbanist animate-in fade-in zoom-in-95 duration-200">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            {/* Close button */}
            <button
              onClick={() => {
                setShowAuthModal(false);
                setHasDismissedModal(true);
              }}
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


              <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                Unlock Full Capabilities 
              </h3>
              
              <p className="text-sm text-zinc-500 mt-2.5 max-w-sm leading-relaxed">
                You are playing with a live sandbox demo. Save your brand profile and connect live channels to start repurposing:
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
                onClick={() => {
                  setShowAuthModal(false);
                  setHasDismissedModal(true);
                }}
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
