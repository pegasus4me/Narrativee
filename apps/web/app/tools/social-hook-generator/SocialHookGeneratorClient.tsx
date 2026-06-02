"use client";

import { useState, useMemo } from "react";
import { LandingHeader } from "../../components/landing";
import Footer from "../../components/commons/Footer";
import { 
  Share2, 
  Sparkles, 
  Copy, 
  Check, 
  Twitter, 
  Linkedin, 
  MessageSquare, 
  Heart, 
  Repeat2, 
  Bookmark, 
  ExternalLink,
  ThumbsUp
} from "lucide-react";

type ToneType = "bold" | "analytical" | "curiosity" | "story";

export default function SocialHookGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<ToneType>("curiosity");
  const [activePlatform, setActivePlatform] = useState<"x" | "linkedin">("x");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Generate templates based on Topic and Tone
  const generatedHooks = useMemo(() => {
    if (!topic.trim()) return { x: [] as string[], linkedin: [] as string[] };

    const cleanTopic = topic.trim().replace(/[.!?]+$/, "");
    const topicLower = cleanTopic.charAt(0).toLowerCase() + cleanTopic.slice(1);

    const templates = {
      bold: {
        x: [
          `Hot take: Most advice on ${topicLower} is completely broken.\n\nHere is the contrarian truth that 99% of people miss (and the simple 3-step framework to actually fix it): 👇`,
          `If you are still struggling to solve ${topicLower}, you are probably following outdated guides.\n\nStop copying the crowd. Here is what actually works in 2026: 🧵`,
          `Unpopular opinion: ${cleanTopic} shouldn't be this complicated.\n\nHere is the raw, unfiltered truth that elite creators use behind closed doors: 👇`
        ],
        linkedin: [
          `I’m going to share a contrarian take that might ruffle some feathers.\n\nMost leaders completely fail at ${topicLower} because they copy outdated templates.\n\nAfter auditing dozens of strategies, I’ve realized the real secret isn't what you think. Here is the exact playbook we used to scale, with no fluff:\n\n1. Reverse your assumptions\n2. Focus on leverage over volume\n3. Match the channel intent\n\nFull framework breakdown in the thread below. 👇`,
          `Stop trying to optimize ${topicLower} using standard methods.\n\nThey don't work anymore. Here is the contrarian strategy that actually moves the needle today...`
        ]
      },
      analytical: {
        x: [
          `We spent 40+ hours analyzing the data behind ${topicLower}.\n\nThe findings reveal a massive industry shift—and a huge opportunity for creators.\n\nHere are the 3 key takeaways you need to know today: 🧵`,
          `The math behind ${topicLower} is changing rapidly.\n\nWe audited 100+ campaigns to understand the core drivers. Here is the exact data-driven breakdown of what works: 📊`,
          `Want to 2x your results with ${topicLower}?\n\nIt comes down to one critical metric. Here is the full data-backed guide on how to implement it: 👇`
        ],
        linkedin: [
          `Numbers don’t lie: ${cleanTopic} has undergone a massive 47% performance shift this quarter.\n\nWe spent the last month analyzing the datasets of top performing campaigns. The results were completely unexpected.\n\nHere is what the data actually tells us:\n\n📈 Takeaway 1: Quality beats speed by 3.4x.\n📉 Takeaway 2: Traditional channels are losing high-intent buyers.\n⚡ Takeaway 3: Platform-native distribution is the ultimate multiplier.\n\nIf you want to read the full analytical report, drop a comment below and I'll send it over.`,
          `The analytical guide to ${topicLower}.\n\nNo opinions. Just raw data and actionable insights that you can deploy in under 5 minutes...`
        ]
      },
      curiosity: {
        x: [
          `It took me 4 years to master the art of ${topicLower}.\n\nYou can learn the full framework in less than 45 seconds.\n\nHere is the step-by-step secret: 🧵`,
          `The single biggest mistake people make with ${topicLower} is hiding in plain sight.\n\nOnce you see it, you can't unsee it.\n\nHere is the breakdown of how to avoid it: 👇`,
          `Want to know the secret behind ${topicLower} that top creators keep hidden?\n\nIt’s simpler than you think. Here is the ultimate blueprint: 🧵`
        ],
        linkedin: [
          `I spent 4 years failing at ${topicLower}.\n\nThen, I made one tiny shift, and everything changed.\n\nMost creators think they need complex funnels or massive budgets. In reality, it comes down to a single curiosity loop that keeps readers hooked.\n\nI’ve documented the exact step-by-step playbook I wish I had when I started.\n\nClick below to read the full guide. 👇`,
          `The secret behind ${topicLower} is hiding in plain sight.\n\nHere is the exact framework I used to crack the code and how you can copy it today...`
        ]
      },
      story: {
        x: [
          `12 months ago, I was completely stuck trying to figure out ${topicLower}.\n\nThen, I met a mentor who gave me one piece of advice that changed my entire trajectory.\n\nHere is the story: 🧵`,
          `I failed miserably trying to optimize ${topicLower} last year.\n\nIt cost me thousands of dollars and weeks of wasted effort. But it taught me 3 invaluable lessons.\n\nHere is what happened (so you don't repeat my mistakes): 👇`,
          `Let me tell you a quick story about how we transformed our approach to ${topicLower} in just 30 days...\n\nHere is the step-by-step sequence: 🧵`
        ],
        linkedin: [
          `A year ago, I was completely stuck on ${topicLower}.\n\nI was working 60-hour weeks, trying every trick in the book, yet seeing zero traction. I was ready to quit.\n\nThen, I had a conversation with a founder that changed everything. She told me: "Stop building for the algorithm. Build for the relationship."\n\nThat one shift changed my entire career. Here is the exact playbook we built off that advice:\n\n• Focus on native storytelling\n• Address the reader's real pain points\n• Build feedback loops\n\nIf you're currently in the grind, remember: the breakthrough is closer than you think.`,
          `Failure is the ultimate teacher.\n\nLast month, I made a massive mistake with ${topicLower}. Here is the story of what went wrong, and the lessons we learned...`
        ]
      }
    };

    return templates[tone];
  }, [topic, tone]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-manrope">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-1/4 top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#483BFF]/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#36A5FF]/10 blur-[100px]" />
      </div>

      <LandingHeader />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full relative z-10">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border border-zinc-800 bg-zinc-900 text-zinc-400 mb-4">
            <Share2 size={12} className="text-[#36A5FF]" />
            <span>Free Repurposing Tools</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-urbanist bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent tracking-tight">
            LinkedIn & Twitter Hook Generator
          </h1>
          <p className="text-zinc-400 mt-4 text-base md:text-lg">
            Repurpose your newsletter core topics into attention-grabbing social media hooks. Select your tone, grab conversion-optimized drafts, and see live feed mockups.
          </p>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Topic Editor & Tone Switch */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Input card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md">
              <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                <span>1. Enter Newsletter Core Topic or Summary</span>
              </h2>
              <textarea
                placeholder="e.g. Scaling organic subscriber growth using a referral program that drives viral sharing..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
                className="w-full h-24 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#36A5FF] transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs text-zinc-500 mt-2">
                <span>Describe your main takeaway in 1-2 sentences.</span>
                <span>{topic.length}/200</span>
              </div>
            </div>

            {/* Tone Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md">
              <h2 className="text-sm font-semibold text-zinc-200 mb-4">
                2. Select Your Writing Style
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "curiosity", label: "Curiosity Gap", desc: "Build loops" },
                  { id: "analytical", label: "Analytical", desc: "Data & stats" },
                  { id: "bold", label: "Contrarian", desc: "Bold hooks" },
                  { id: "story", label: "Narrative", desc: "Personal story" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTone(item.id as ToneType)}
                    className={`rounded-xl border p-3.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${tone === item.id ? "border-[#483BFF] bg-[#483BFF]/10 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"}`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[9px] opacity-60 font-medium">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hook List Result Panel */}
            {topic.trim() && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-[#36A5FF]" />
                    <span>Your Social Media Hook Drafts</span>
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActivePlatform("x")}
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 border ${activePlatform === "x" ? "bg-white text-black border-white" : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white"}`}
                    >
                      <Twitter size={10} />
                      Twitter/X
                    </button>
                    <button
                      onClick={() => setActivePlatform("linkedin")}
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 border ${activePlatform === "linkedin" ? "bg-white text-black border-white" : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white"}`}
                    >
                      <Linkedin size={10} />
                      LinkedIn
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {(activePlatform === "x" ? generatedHooks.x : generatedHooks.linkedin).map((hook, index) => (
                    <div 
                      key={index}
                      className="group flex flex-col gap-3 rounded-xl border border-zinc-850 bg-zinc-950 p-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap text-left font-medium">
                        {hook}
                      </div>
                      <div className="flex justify-between items-center border-t border-zinc-900 pt-3 mt-1">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                          Hook Option {index + 1}
                        </span>
                        <button
                          onClick={() => handleCopy(hook, index)}
                          className="rounded-lg px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer text-zinc-400 flex items-center gap-1.5 text-xs shrink-0 font-semibold"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy Post</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Platform Interactive Mock Feed Preview */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {!topic.trim() ? (
              // Empty State Dashboard Placeholder
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-8 text-center backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
                <div className="rounded-full bg-zinc-950 border border-zinc-800 p-4 mb-4 text-zinc-600">
                  <Share2 size={32} />
                </div>
                <h3 className="text-base font-semibold text-zinc-400">Live feed Mockup</h3>
                <p className="text-xs text-zinc-600 max-w-xs mt-2 leading-relaxed">
                  Enter your topic description on the left side to instantly render native social media feed mockups for LinkedIn and X.
                </p>
              </div>
            ) : (
              // Active Feed Card Preview Container
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 backdrop-blur-md flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-850 pb-3 flex items-center justify-between">
                  <span>Interactive Feed Preview</span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    {activePlatform === "x" ? "Twitter/X Feed" : "LinkedIn Post"}
                  </span>
                </h3>

                {activePlatform === "x" ? (
                  // Twitter X Feed Preview Card
                  <div className="rounded-xl border border-zinc-800 bg-black p-4 text-left font-sans select-none">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#483BFF] to-[#36A5FF] shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md">
                        ME
                      </div>
                      
                      {/* Post body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-zinc-100 hover:underline">My Brand Voice</span>
                          <span className="text-xs text-zinc-500">@newsletter_creator</span>
                          <span className="text-xs text-zinc-500">· 2h</span>
                        </div>
                        <p className="text-[14px] leading-relaxed text-zinc-200 mt-1 whitespace-pre-wrap">
                          {generatedHooks.x[0] || ""}
                        </p>

                        {/* Interactive Icons */}
                        <div className="flex justify-between items-center text-zinc-500 mt-4 max-w-sm text-xs">
                          <button className="flex items-center gap-1 hover:text-sky-500 transition-colors">
                            <MessageSquare size={13} />
                            <span>12</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                            <Repeat2 size={13} />
                            <span>8</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
                            <Heart size={13} />
                            <span>42</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-sky-500 transition-colors">
                            <Bookmark size={13} />
                            <span>5</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // LinkedIn Post Preview Card
                  <div className="rounded-xl border border-zinc-800 bg-[#1b1c1e] p-4 text-left font-sans select-none">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#36A5FF] to-[#483BFF] shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md">
                          ME
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-zinc-100 hover:underline">My Brand Voice</span>
                            <span className="text-[10px] text-zinc-500 font-semibold">· 1st</span>
                          </div>
                          <p className="text-[10px] text-zinc-400">Newsletter Publisher & Content Expert</p>
                          <p className="text-[9px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            2h · Edited · 🌐
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#36A5FF] font-bold hover:underline cursor-pointer">
                        + Follow
                      </span>
                    </div>

                    {/* Post Content */}
                    <p className="text-[12px] leading-relaxed text-zinc-200 whitespace-pre-wrap">
                      {generatedHooks.linkedin[0] || ""}
                    </p>

                    {/* Engagement Counts */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-850 py-2.5 mt-4">
                      <span className="flex items-center gap-1 text-zinc-400">
                        👍 💡 ❤️ 68
                      </span>
                      <span>18 comments</span>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-around items-center text-zinc-400 mt-2 text-xs pt-1">
                      <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors py-1">
                        <ThumbsUp size={13} />
                        <span>Like</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors py-1">
                        <MessageSquare size={13} />
                        <span>Comment</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors py-1">
                        <Repeat2 size={13} />
                        <span>Repost</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Conversion Callout */}
                <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-4 mt-2 text-xs text-zinc-400 flex flex-col gap-2.5">
                  <div className="text-left font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#36A5FF]" />
                    <span>How Narrativee Automates This</span>
                  </div>
                  <p className="text-left leading-relaxed text-[11px]">
                    Instead of writing hooks manually, Narrativee extracts the absolute best high-performing angles from your newsletter automatically and generates native draft cycles in seconds.
                  </p>
                  <a 
                    href="/auth/signup" 
                    className="inline-flex items-center justify-between rounded-lg border border-[#36A5FF]/30 bg-[#36A5FF]/10 hover:bg-[#36A5FF]/20 px-3 py-2 text-xs font-bold text-[#36A5FF] transition-all"
                  >
                    <span>Repurpose your entire newsletter free</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
