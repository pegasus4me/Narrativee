"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Flame, 
  BookOpen, 
  ArrowLeft, 
  MessageSquare, 
  Award,
  Zap
} from "lucide-react";
import { 
  LINKEDIN_LOGO, 
  X_LOGO, 
  THREADS_LOGO, 
  FACEBOOK_LOGO, 
  BLUESKY_LOGO 
} from "@/app/constants";

interface HookItem {
  id: string;
  platform: string;
  category: string;
  title: string;
  template: string;
  example: string;
  isCustom?: boolean;
}

const PRELOADED_HOOKS: HookItem[] = [
  // LinkedIn
  {
    id: "li-1",
    platform: "linkedin",
    category: "The Contrarian",
    title: "The Counter-Intuitive Truth",
    template: "I spent [Number] hours analyzing [Subject].\n\nHere is the exact [Result] formula (zero fluff):\n\n[Key Insight]\n\nHere is the 3-step playbook that changed everything 👇",
    example: "I spent 30 hours analyzing why some newsletters go viral on LinkedIn.\n\nHere is the exact growth formula (zero fluff):\n\nQuality hooks trump high frequency every time.\n\nHere is the 3-step playbook that changed everything 👇",
  },
  {
    id: "li-2",
    platform: "linkedin",
    category: "Pattern Interrupt",
    title: "Every founder says...",
    template: "Every [Profession] says they want [Goal].\n\nThey read books. They hire people. And then, quietly, without fully meaning to, they take the work back.\n\nIt's not about [Excuse]. It's about [Real Fear/Root Cause].",
    example: "Every founder says they want to delegate more.\n\nThey read books. They hire people. And then, quietly, without fully meaning to, they take the work back.\n\nIt's not about quality standards. It's about facing your own irrelevance the moment ownership leaves your hands.",
  },
  {
    id: "li-3",
    platform: "linkedin",
    category: "Social Proof / Authority",
    title: "The Hard Milestone",
    template: "We just reached [Milestone] without spending a single dollar on [Marketing/Ads].\n\nNo hacks. No tricks. Just 3 simple pillars:\n\n1. [Pillar 1]\n2. [Pillar 2]\n3. [Pillar 3]\n\nHere is the raw breakdown of how we did it:",
    example: "We just reached 150K users without spending a single dollar on advertising.\n\nNo hacks. No tricks. Just 3 simple pillars:\n\n1. Input-focused habit building\n2. Authentic storytelling\n3. Relentless feedback loops\n\nHere is the raw breakdown of how we did it:",
  },
  {
    id: "li-4",
    platform: "linkedin",
    category: "Mistake / Pitfall",
    title: "You don't have a X problem",
    template: "You don't have a [Common Symptom] problem.\n\nYou have a [Hidden Root Cause] problem.\n\nHere is why [Activity] always fails, and what you should do instead 👇",
    example: "You don't have a delegation problem.\n\nYou have a control problem.\n\nHere is why scaling always fails, and what you should do instead 👇",
  },

  // Twitter/X
  {
    id: "x-1",
    platform: "x",
    category: "Viral Thread Starter",
    title: "90% of X is waste",
    template: "90% of [Topic] is absolute waste. 🧵\n\nMost people do [Common Mistake]. It fails.\n\nHere is my simple 4-step framework to achieve [Desired Outcome] 👇",
    example: "90% of content repurposing is absolute waste. 🧵\n\nMost people copy-paste their newsletters to Twitter. It fails.\n\nHere is my simple 4-step framework to translate deep essays into viral threads 👇",
  },
  {
    id: "x-2",
    platform: "x",
    category: "Curator Hook",
    title: "The Resource goldmine",
    template: "I've curated [Number] of the best resources on [Subject].\n\nNo courses. No fluff. Just pure high-signal guides.\n\nLike + Bookmark this thread, and I'll send it directly to your DM for free.",
    example: "I've curated 47 of the best resources on startup branding.\n\nNo courses. No fluff. Just pure high-signal guides.\n\nLike + Bookmark this thread, and I'll send it directly to your DM for free.",
  },
  {
    id: "x-3",
    platform: "x",
    category: "Direct Punchy",
    title: "Stop doing Y",
    template: "If you are still [Common Activity] in 2026, you are losing [Asset/Value].\n\nHere is how to build a [Better Alternative] in less than 15 minutes a day 👇",
    example: "If you are still writing social posts manually in 2026, you are losing hours of focus.\n\nHere is how to build an automated content generator in less than 15 minutes a day 👇",
  },

  // Threads
  {
    id: "th-1",
    platform: "threads",
    category: "Conversational",
    title: "Can we talk about...",
    template: "Can we talk about [Relatable Topic]?\n\nBecause I feel like everyone is quietly pretending that [Common Struggle] isn't happening. Let's be honest about this.",
    example: "Can we talk about entrepreneur burnout?\n\nBecause I feel like everyone is quietly pretending that working 80 hours a week is completely fine. Let's be honest about this.",
  },
  {
    id: "th-2",
    platform: "threads",
    category: "Hot Take",
    title: "Unpopular Opinion",
    template: "Unpopular opinion:\n\n[Topic] is actually the easiest way to [Goal]. You just have to ignore the traditional advice of [Traditional Rule]. What's your take?",
    example: "Unpopular opinion:\n\nWriting daily is actually the easiest way to build a personal brand. You just have to ignore the traditional advice of high-concept polishing. What's your take?",
  },
  {
    id: "th-3",
    platform: "threads",
    category: "The Contrarian",
    title: "Nobody talks about...",
    template: "Nobody talks about [hidden problem].\n\nEveryone focuses on [obvious thing].\n\nBut the real growth comes from [underestimated thing].",
    example: "Nobody talks about builder burnout.\n\nEveryone focuses on metrics and launch day.\n\nBut the real growth comes from sustainable pace.",
  },
  {
    id: "th-4",
    platform: "threads",
    category: "The Contrarian",
    title: "Harsh Truth",
    template: "Harsh truth:\n\n[Common behavior] is not [desired result].\n\nIt’s just [painful reality].",
    example: "Harsh truth:\n\nScrolling all day is not market research.\n\nIt’s just procrastination.",
  },
  {
    id: "th-5",
    platform: "threads",
    category: "Conversational",
    title: "I used to think...",
    template: "I used to think [old belief].\n\nThen I realized [new belief].\n\nNow I [new behavior].",
    example: "I used to think working harder solved everything.\n\nThen I realized working on the wrong things leads nowhere.\n\nNow I prioritize ruthlessly.",
  },
  {
    id: "th-6",
    platform: "threads",
    category: "Mistake / Pitfall",
    title: "The Creator Trap",
    template: "The creator trap:\n\nYou spend [time] creating [content].\n\nThen you spend [tiny effort] distributing it.\n\nAnd wonder why growth is slow.",
    example: "The creator trap:\n\nYou spend 10 hours creating high-quality articles.\n\nThen you spend 2 minutes posting a link.\n\nAnd wonder why growth is slow.",
  },
  {
    id: "th-7",
    platform: "threads",
    category: "Pattern Interrupt",
    title: "Stop / Start",
    template: "Stop [common bad habit].\n\nStart [better habit].\n\nThat’s how you [desired result].",
    example: "Stop checking analytics every hour.\n\nStart talking to your actual users.\n\nThat’s how you build a real product.",
  },
  {
    id: "th-8",
    platform: "threads",
    category: "Conversational",
    title: "Reminder: [Your content]",
    template: "Reminder:\n\n[Your content] doesn’t have to [limiting belief].\n\nIt can [better possibility].",
    example: "Reminder:\n\nYour first draft doesn’t have to be perfect.\n\nIt can just be finished.",
  },

  // Facebook
  {
    id: "fb-1",
    platform: "facebook",
    category: "Storytelling",
    title: "I remember when...",
    template: "I remember when I first started [Topic].\n\nI had zero connections, no money, and absolutely no idea what I was doing.\n\nHere is the single shift that changed everything for me:",
    example: "I remember when I first started writing online.\n\nI had zero connections, no money, and absolutely no idea what I was doing.\n\nHere is the single shift that changed everything for me:",
  },

  // Bluesky
  {
    id: "bs-1",
    platform: "bluesky",
    category: "Raw Tech / High Signal",
    title: "The Open Web Take",
    template: "The future of [Industry] is in decentralized [Asset].\n\nHere is a quick high-signal deep dive on how we are leveraging [Tech] to solve [Problem] 🦋",
    example: "The future of creator pipelines is in decentralized publishing protocol APIs.\n\nHere is a quick high-signal deep dive on how we are leveraging AT Protocol to solve distribution blocks 🦋",
  }
];

const PLATFORM_META: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  linkedin: {
    label: "LinkedIn",
    icon: LINKEDIN_LOGO,
    bg: "bg-[#0A66C2]/10 border-[#0A66C2]/20 hover:bg-[#0A66C2]/15",
    text: "text-[#0A66C2]"
  },
  x: {
    label: "X (Twitter)",
    icon: X_LOGO,
    bg: "bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800/60",
    text: "text-zinc-300"
  },
  threads: {
    label: "Threads",
    icon: THREADS_LOGO,
    bg: "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/60",
    text: "text-white"
  },
  facebook: {
    label: "Facebook",
    icon: FACEBOOK_LOGO,
    bg: "bg-[#1877F2]/10 border-[#1877F2]/20 hover:bg-[#1877F2]/15",
    text: "text-[#1877F2]"
  },
  bluesky: {
    label: "Bluesky",
    icon: BLUESKY_LOGO,
    bg: "bg-[#1877F2]/10 border-[#1877F2]/20 hover:bg-[#1877F2]/15",
    text: "text-[#1877F2]"
  }
};

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "The Contrarian", label: "Contrarian", icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
  { id: "Pattern Interrupt", label: "Pattern Interrupt", icon: <Flame className="w-3.5 h-3.5 text-orange-500" /> },
  { id: "Social Proof / Authority", label: "Authority", icon: <Award className="w-3.5 h-3.5 text-violet-400" /> },
  { id: "Mistake / Pitfall", label: "Pitfall", icon: <Zap className="w-3.5 h-3.5 text-rose-400" /> },
  { id: "Conversational", label: "Conversational", icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> },
];

export default function HooksLibraryPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hooks, setHooks] = useState<HookItem[]>(PRELOADED_HOOKS);
  
  // Custom Hook Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("The Contrarian");
  const [newPlatform, setNewPlatform] = useState("linkedin");
  const [newTemplate, setNewTemplate] = useState("");
  const [newExample, setNewExample] = useState("");

  // Copy success animation states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter hooks dynamically
  const filteredHooks = useMemo(() => {
    return hooks.filter((hook) => {
      const matchesPlatform = selectedPlatform === "all" || hook.platform === selectedPlatform;
      const matchesCategory = selectedCategory === "all" || hook.category === selectedCategory;
      const matchesSearch = 
        hook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hook.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hook.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlatform && matchesCategory && matchesSearch;
    });
  }, [hooks, selectedPlatform, selectedCategory, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddHook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTemplate.trim()) return;

    const newHook: HookItem = {
      id: `custom-${Date.now()}`,
      platform: newPlatform,
      category: newCategory,
      title: newTitle,
      template: newTemplate,
      example: newExample || newTemplate,
      isCustom: true
    };

    setHooks((prev) => [newHook, ...prev]);
    
    // Reset Form
    setNewTitle("");
    setNewTemplate("");
    setNewExample("");
    setShowAddForm(false);
  };

  const handleDeleteHook = (id: string) => {
    setHooks((prev) => prev.filter((hook) => hook.id !== id));
  };

  return (
    <div className="mx-auto w-[90%] space-y-8 px-6 py-8">
      {/* Top Header section */}
      <div className="space-y-4">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-brand animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Library Engine</p>
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-100 md:text-4xl">
              High-Converting Reusable Hooks
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Browse and save scroll-stopping hook templates curated for LinkedIn, X, Threads, and more. Fuel your generations with custom formats that perfectly represent your creator voice.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-xs font-bold text-white transition-all hover:bg-brand/90 shadow-md shadow-brand/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Custom Hook
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-white/5 pb-6">
        {/* Platform Selection pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPlatform("all")}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              selectedPlatform === "all"
                ? "bg-brand text-white border-brand/10"
                : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-zinc-200"
            }`}
          >
            All Platforms
          </button>
          {Object.entries(PLATFORM_META).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSelectedPlatform(key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                selectedPlatform === key
                  ? "bg-zinc-800 text-zinc-100 border-zinc-700/80 ring-1 ring-white/10"
                  : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-zinc-200"
              }`}
            >
              <img src={value.icon} alt="" className={`w-3.5 h-3.5 object-contain ${key === 'threads' ? 'invert' : ''}`} />
              {value.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates or strategies..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-white/20 transition-all"
          />
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Category side navigation */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-3 mb-3">Strategies</p>
          <div className="flex flex-row overflow-x-auto lg:flex-col gap-1 pb-4 lg:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-brand/10 text-brand border border-brand/20 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.01]"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Display Grid */}
        <div className="space-y-6">
          {filteredHooks.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-12 text-center flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 text-zinc-600 mb-4" />
              <h3 className="text-base font-semibold text-zinc-300">No hooks matched your filters</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm">
                Try resetting your search query, choosing another strategy filter, or save a new customized hook above!
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredHooks.map((hook) => {
                const meta = PLATFORM_META[hook.platform] || {
                  label: hook.platform,
                  icon: "",
                  bg: "bg-zinc-850/50 border-white/10",
                  text: "text-zinc-300"
                };
                const isCopied = copiedId === hook.id;

                return (
                  <article 
                    key={hook.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-950/40 p-5 hover:bg-zinc-950/60 hover:border-white/15 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
                  >
                    <div className="space-y-4">
                      {/* Hook Metadata */}
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold border uppercase ${meta.bg} ${meta.text}`}>
                            {meta.icon && (
                              <img src={meta.icon} alt="" className={`w-2.5 h-2.5 object-contain ${hook.platform === 'threads' ? 'invert' : ''}`} />
                            )}
                            {meta.label}
                          </span>
                          <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[9px] font-bold text-brand uppercase tracking-wide">
                            {hook.category}
                          </span>
                        </div>
                        {hook.isCustom && (
                          <button
                            onClick={() => handleDeleteHook(hook.id)}
                            className="p-1 rounded-md text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete custom hook"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Hook Body */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-zinc-200">
                          {hook.title}
                        </h4>
                        <div className="relative rounded-xl border border-white/5 bg-zinc-950/90 p-4 text-xs font-mono leading-relaxed text-zinc-350 min-h-[100px] whitespace-pre-wrap select-all">
                          {hook.template}
                        </div>
                      </div>

                      {/* Dynamic Preview Accordion / Details */}
                      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-[11px] leading-relaxed text-zinc-450 space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Dynamic example:</span>
                        <p className="italic font-light">"{hook.example}"</p>
                      </div>
                    </div>

                    {/* Copy and Actions */}
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-light">Click to copy template for generation</span>
                      <button
                        onClick={() => handleCopy(hook.id, hook.template)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition-all border ${
                          isCopied 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Template
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Hook Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#09090b] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-zinc-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand" />
                  Add New Reusable Hook
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Save your best hooks to use them instantly inside the generation framework.
                </p>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHook} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Platform */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-white/10 text-zinc-100 focus:outline-none focus:border-white/20 transition-all"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X (Twitter)</option>
                    <option value="threads">Threads</option>
                    <option value="facebook">Facebook</option>
                    <option value="bluesky">Bluesky</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Strategy</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-white/10 text-zinc-100 focus:outline-none focus:border-white/20 transition-all"
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Hook Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. The 30-Hour Formula"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-white/10 text-zinc-100 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* Template */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Hook Template</label>
                <textarea
                  required
                  rows={4}
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  placeholder="Use square brackets for custom values e.g. I spent [Number] hours on [Subject]..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-white/10 text-zinc-100 focus:outline-none focus:border-white/20 transition-all font-mono resize-y"
                />
              </div>

              {/* Example */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Live Example (Optional)</label>
                <textarea
                  rows={2}
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="An example filled with real data to illustrate..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-white/10 text-zinc-100 focus:outline-none focus:border-white/20 transition-all resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-brand hover:bg-brand/90 text-white transition-all cursor-pointer"
                >
                  Save Hook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple absolute fallback for X icon from Lucide
function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  );
}
