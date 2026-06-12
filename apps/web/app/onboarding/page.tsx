"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  Sparkles,
  Link2,
  CheckCircle2,
  Plus,
  Loader2,
  BookOpen,
  ArrowRight,
  Brain,
  Rss,
  Mail,
  Zap,
} from "lucide-react";
import {
  useChannels,
  useAddSource,
  useSources,
  useKnowledgeBase,
  useSaveKnowledgeBase,
  useCompleteOnboarding,
} from "@/app/hooks/api";
import { API_URL } from "@/lib/api-config";
import {
  LINKEDIN_LOGO,
  X_LOGO,
  THREADS_LOGO,
  FACEBOOK_LOGO,
  INSTAGRAM_LOGO,
} from "@/app/constants";

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
  instagram: {
    label: "Instagram",
    icon: <img src={INSTAGRAM_LOGO} alt="Instagram" className="h-5 w-5 object-contain" />,
    color: "text-[#E1306C]",
    bg: "bg-[#E1306C]/10 border-[#E1306C]/20",
  },
};

/**
 * Renders the multi-step user onboarding flow.
 * Only accessible to logged-in users who haven't completed onboarding.
 */
export default function OnboardingPage(): React.ReactNode {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Local onboarding state
  const [step, setStep] = useState<number>(1);
  const [rssUrl, setRssUrl] = useState<string>("");
  const [voiceRules, setVoiceRules] = useState<string>("");
  const [sourceSuccess, setSourceSuccess] = useState<string>("");
  const [sourceError, setSourceError] = useState<string>("");
  const [isSandboxing, setIsSandboxing] = useState<boolean>(false);

  // API hooks
  const { data: channels = [], isLoading: channelsLoading } = useChannels(!!session?.user);
  const { data: sources = [], isLoading: sourcesLoading } = useSources(!!session?.user);
  const addSource = useAddSource();
  const { data: kb } = useKnowledgeBase(!!session?.user);
  const saveKb = useSaveKnowledgeBase();
  const completeOnboarding = useCompleteOnboarding();

  // Redirect if already onboarded
  useEffect(() => {
    if (!sessionPending) {
      if (!session?.user) {
        router.push("/auth/signin");
      } else if (session.user.onboarded) {
        router.push("/workspace");
      }
    }
  }, [session, sessionPending, router]);

  // Load step and voice rules from storage / database
  useEffect(() => {
    const savedStep = localStorage.getItem("onboarding_step");
    if (savedStep) {
      setStep(parseInt(savedStep, 10));
    }
  }, []);

  useEffect(() => {
    if (kb?.brandVoiceTraining && !voiceRules) {
      setVoiceRules(kb.brandVoiceTraining);
    }
  }, [kb, voiceRules]);

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    localStorage.setItem("onboarding_step", newStep.toString());
  };

  const handleConnectSocial = (platform: string) => {
    // Save current step so the user returns to step 1 after redirecting back
    localStorage.setItem("onboarding_step", "1");
    window.location.href = `${API_URL}/channels/connect/${platform}`;
  };

  const handleAddNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rssUrl.trim()) return;

    setSourceError("");
    setSourceSuccess("");

    try {
      await addSource.mutateAsync({ url: rssUrl, platform: "substack" });
      setSourceSuccess("Newsletter feed connected successfully!");
      setRssUrl("");
    } catch (err: unknown) {
      setSourceError(err instanceof Error ? err.message : "Failed to sync feed");
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      // 1. Save voice training if filled
      if (voiceRules.trim() || kb) {
        await saveKb.mutateAsync({
          ...(kb ?? {
            customHooks: [],
            customTemplates: [],
            bannedWords: [],
            brandVoiceTraining: "",
            voiceMemory: {
              sources: [],
              profile: {
                tone: "",
                vocabulary: "",
                sentenceLength: "",
                humorLevel: "",
                opinionatedVsNeutral: "",
                ctaStyle: "",
                topicsToAvoid: "",
                frequentPhrases: "",
              },
              strictness: 50,
              status: "idle",
              lastLearnedAt: null,
              lastLearnedSourceId: null,
            },
          }),
          brandVoiceTraining: voiceRules,
        });
      }

      // 2. Mark user as onboarded in the database
      await completeOnboarding.mutateAsync();

      // 3. Clear onboarding state
      localStorage.removeItem("onboarding_step");

      // 4. Force a clean dashboard reload
      window.location.href = "/workspace";
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  };

  const handleEnterSandbox = async () => {
    if (isSandboxing) return;
    setIsSandboxing(true);

    try {
      const res = await fetch(`${API_URL}/user/onboard-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Failed to seed demo sandbox");
      }

      // Force a clean dashboard reload
      window.location.href = "/workspace";
    } catch (err) {
      console.error("Failed to seed sandbox:", err);
      setIsSandboxing(false);
    }
  };

  const connectedPlatforms = new Set(channels.map((c) => c.platform));

  if (sessionPending || !session?.user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b]">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          Synchronizing mission control...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black flex items-center justify-center overflow-hidden font-urbanist">
      {/* Sleek blurred dashboard background mockup */}


      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="relative w-full max-w-xl rounded-3xl p-10 shadow-[0_20px_80px_rgba(0,0,0,0.5)] flex flex-col gap-6 z-10 animate-in zoom-in-95 duration-150 text-zinc-200">

          {/* Welcome Header */}
          <div className="space-y-1.5 animate-in fade-in duration-300">
            <h1 className="text-3xl font-base font-base text-white">
              Welcome, {session?.user?.name || "there"}!
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Let's customize your workspace and connect your content pipeline. <span className="text-brand font-medium font-urbanist">Completing this step earns you 10 credits.</span>
            </p>
          </div>

          {/* Quick Demo Sandbox Option */}
          <div className="p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-300 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-0.5 text-left">
              <p className="text-sm font-base text-white flex items-center gap-1">
                Want to test the app instantly?
              </p>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                Skip setup and enter a fully seeded sandbox with demo posts and mock channels.
              </p>
            </div>
            <button
              onClick={handleEnterSandbox}
              disabled={isSandboxing}
              className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/70 text-white text-xs font-base font-urbanist transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSandboxing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Seeding Sandbox...
                </>
              ) : (
                "Try Instant Demo"
              )}
            </button>
          </div>

          {/* Header & Step Tracker */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-base text-white font-base tracking-widest flex items-center gap-1.5">
                Step {step} of 3 <span className="text-zinc-600">•</span> <span className="text-brand font-medium font-urbanist">🎁 +10 Credits Reward</span>
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-6 bg-brand/70" : "w-1.5 bg-white/10"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* STEP 1: Connect Social Channels */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-base font-base text-zinc-100 flex items-center gap-2">
                  <Link2 className="w-6 h-6 text-white" />
                  Connect Social Channels
                </h2>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Link your social media profiles. Narrativee will format and schedule your generated post packs directly to these destinations.
                </p>
              </div>

              {channelsLoading ? (
                <div className="flex items-center justify-center py-6 text-zinc-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Fetching connections...
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {Object.entries(PLATFORM_META).map(([platform, meta]) => {
                    const isConnected = connectedPlatforms.has(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => !isConnected && handleConnectSocial(platform)}
                        disabled={isConnected}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-medium transition-all ${isConnected
                          ? "bg-zinc-900/40 text-zinc-650 border border-zinc-800/40"
                          : "bg-zinc-900/80 text-zinc-200 border border-zinc-800 hover:bg-zinc-800/60 hover:text-white"
                          }`}
                      >
                        <div className={isConnected ? "opacity-40" : meta.color}>{meta.icon}</div>
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
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-[10px] text-zinc-500 font-light">
                  {channels.length > 0 ? `${channels.length} channel(s) connected` : "No channels connected yet"}
                </span>
                <button
                  onClick={() => handleStepChange(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand/70 text-white px-5 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                >
                  Next: Sync Newsletter
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Connect Newsletter Source */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-base font-base text-zinc-100 flex items-center gap-2">
                  <Rss className="w-6 h-6 text-indigo-400" />
                  Connect Newsletter Source
                </h2>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Add your newsletter URL (e.g. Substack or custom RSS). Narrativee will automatically fetch your issues so you can draft social campaigns in seconds.
                </p>
              </div>

              <form onSubmit={handleAddNewsletter} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={rssUrl}
                    onChange={(e) => setRssUrl(e.target.value)}
                    placeholder="e.g. https://yourpublication.substack.com"
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-white/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={addSource.isPending}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-brand hover:bg-brand/70 text-white disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {addSource.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Sync
                  </button>
                </div>

                {sourceSuccess && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {sourceSuccess}
                  </p>
                )}
                {sourceError && (
                  <p className="text-[11px] text-rose-400">
                    {sourceError}
                  </p>
                )}
              </form>

              {sources.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[10px] font-base text-zinc-500 font-base tracking-wider">Synced publications</p>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {sources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                        <span className="text-xs truncate font-semibold max-w-[280px]">{source.url}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => handleStepChange(1)}
                  className="px-4 py-2.5 text-xs font-base rounded-xl border border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => handleStepChange(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand/70 text-white px-5 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                >
                  Next: Brand Voice Rules
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Brand Voice Rules */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-base font-base text-zinc-100 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-white" />
                  Define Brand Voice Rules
                </h2>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Teach our AI how you write. Paste an example newsletter section or describe your voice rules (e.g. no buzzwords, use conversational punctuation).
                </p>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={voiceRules}
                  onChange={(e) => setVoiceRules(e.target.value)}
                  placeholder="Example: I write in first-person, keep sentences extremely short, and prefer to explain complex topics using counter-intuitive analogies. Never use corporate marketing speak..."
                  className="w-full px-4 py-3 text-xs rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-white/20 transition-all resize-y font-light leading-relaxed"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => handleStepChange(2)}
                  className="px-4 py-2.5 text-xs font-base rounded-xl border border-white/5 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleFinishOnboarding}
                  disabled={saveKb.isPending || completeOnboarding.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand/70 text-white px-6 py-2.5 text-xs font-semibold tracking-wide transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saveKb.isPending || completeOnboarding.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Finish Onboarding
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
