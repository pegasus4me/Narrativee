import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Cpu, ExternalLink, Sparkles, Terminal, Users, Video } from "lucide-react";
import { LandingHeader } from "../../components/landing";

export const metadata: Metadata = {
  title: "10 Best Content Repurposing Tools for Social Media (2026)",
  description: "Factual review of the best content repurposing tools for content creators and marketers. Save hours by converting newsletters and articles automatically.",
  alternates: {
    canonical: "/features/content-repurposing-tools",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/features/content-repurposing-tools",
    siteName: "Narrativee",
    title: "10 Best Content Repurposing Tools for Social Media (2026) | Narrativee",
    description: "Compare the top AI content repurposing tools. Discover the best platform to turn your newsletter into channel-native posts that match your voice.",
  },
};

const tools = [
  {
    name: "Narrativee",
    tagline: "Best overall for newsletter repurposing and high-fidelity voice cloning",
    desc: "Narrativee is a premium AI-powered content repurposing tool built specifically for writers, publishers, and Substack creators. Instead of generic summaries, it reverse-engineers your writing voice per channel, extracts distinct content angles, and formats native drafts for LinkedIn, X, Threads, and Bluesky. It also features the world's first Substack Notes scheduler.",
    bestFor: "Newsletter creators, Substack operators, and writers who need strict voice consistency.",
    linkText: "Read our Narrativee vs. ChatGPT comparison",
    linkUrl: "/versus/narrativee-vs-chatgpt",
    icon: Sparkles,
    accent: "text-indigo-400",
    borderAccent: "border-indigo-500/20"
  },
  {
    name: "ChatGPT",
    tagline: "Best for wide-ranging brainstorming and raw drafting",
    desc: "OpenAI's ChatGPT is the most versatile AI content repurposing tool. It excels at parsing large text and answering conversational prompts. However, because it starts clean every session, it cannot natively 'remember' your voice or adapt to strict platform length limits without heavy, repetitive prompt engineering.",
    bestFor: "General content brainstorming, coding queries, and multi-disciplinary ideation.",
    linkText: "Read our Narrativee vs. ChatGPT comparison",
    linkUrl: "/versus/narrativee-vs-chatgpt",
    icon: Cpu,
    accent: "text-purple-400",
    borderAccent: "border-purple-500/10"
  },
  {
    name: "Buffer",
    tagline: "Best for traditional multi-network calendar scheduling",
    desc: "Buffer is a reliable, traditional social media scheduler. It provides a clean visual calendar queue to organize drafts across standard networks (Pinterest, Instagram, Facebook). While it features basic AI scheduling aids, it does not act as an automated compiler and provides zero voice-cloning capabilities.",
    bestFor: "Marketing agencies managing empty calendar slots across visual networks.",
    linkText: "Read our Narrativee vs. Buffer comparison",
    linkUrl: "/versus/narrativee-vs-buffer",
    icon: Users,
    accent: "text-blue-400",
    borderAccent: "border-blue-500/10"
  },
  {
    name: "Repurpose.io",
    tagline: "Best for automatic short-form video syndication",
    desc: "Repurpose.io is a specialized video content repurposing tool. It monitors short-form video channels (TikTok, Reels, Shorts) and automatically uploads new files across other networks without watermarks. However, it is entirely unsuited for text-based creators and does not provide written voice cloner models.",
    bestFor: "Video creators and TikTok builders looking for hands-free video syndication.",
    linkText: "Read our Repurpose.io vs. Buffer comparison",
    linkUrl: "/versus/repurpose-io-vs-buffer",
    icon: Video,
    accent: "text-pink-400",
    borderAccent: "border-pink-500/10"
  },
  {
    name: "Postiz",
    tagline: "Best open-source, self-hosted scheduling queue",
    desc: "Postiz is a modern, open-source social media scheduler. It allows developers to self-host their own scheduling queue for free, avoiding channel caps or monthly SaaS fees. It provides basic blank calendars but does not feature proprietary content generation pipelines.",
    bestFor: "Developers and tech-savvy teams seeking total data privacy and custom self-hosting.",
    linkText: "Read our Narrativee vs. Postiz comparison",
    linkUrl: "/versus/narrativee-vs-postiz",
    icon: Terminal,
    accent: "text-cyan-400",
    borderAccent: "border-cyan-500/10"
  },
  {
    name: "Typefully",
    tagline: "Best for Twitter/X thread-writing and analytics",
    desc: "Typefully is a beautiful, minimal writing environment built primarily for Twitter (X) and LinkedIn. It offers a gorgeous draft interface, clean thread previews, and automated engagement plugs. However, it lacks native sitemaps or integrations for Substack and requires manual drafting.",
    bestFor: "Solopreneurs and builders focused primarily on growing an audience on X.",
    linkText: "Read our Typefully vs. Buffer comparison",
    linkUrl: "/versus/typefully-vs-buffer",
    icon: Sparkles,
    accent: "text-violet-400",
    borderAccent: "border-violet-500/10"
  }
];

export default function ContentRepurposingToolsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden pb-24">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 opacity-80 z-0">
        <div className="absolute left-1/2 top-[-10rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-[-10rem] top-[20rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <LandingHeader />

        <main className="max-w-7xl mx-auto px-6 pt-16 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Home
            </Link>
          </div>

          {/* Hero Section */}
          <div className="max-w-4xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Authoritative 2026 Directory</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white font-urbanist leading-[1.05]">
              The Best Content Repurposing Tools.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl font-manrope">
              Tired of copying your newsletter issues manually? Finding the right AI content repurposing tool depends on your target persona. We reviewed the top platforms to help you choose the best workflow to grow your social presence automatically.
            </p>
          </div>

          {/* Core Directory Grid */}
          <section className="space-y-8 mb-24">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              const isUs = tool.name === "Narrativee";
              return (
                <article 
                  key={tool.name}
                  className={`p-8 sm:p-10 rounded-[2.5rem] border ${tool.borderAccent} bg-white/[0.02] relative overflow-hidden backdrop-blur-md`}
                >
                  {isUs && (
                    <div className="absolute top-6 right-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold font-urbanist">
                      ★ #1 Recommendation
                    </div>
                  )}

                  <div className="max-w-4xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/5 ${tool.accent}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-urbanist">
                          {tool.name}
                        </h2>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${tool.accent} mt-1`}>
                          {tool.tagline}
                        </p>
                      </div>
                    </div>

                    <p className="mt-6 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-3xl">
                      {tool.desc}
                    </p>

                    <div className="mt-6 border-t border-white/[0.05] pt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Best For</h4>
                        <p className="text-xs text-zinc-300 font-medium">{tool.bestFor}</p>
                      </div>
                      <div className="flex flex-col justify-end items-start sm:items-end">
                        <Link 
                          href={tool.linkUrl}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white underline underline-offset-4 transition-colors group"
                        >
                          {tool.linkText}
                          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Quick Buying Guide FAQ Section */}
          <section className="border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-20">
            <h2 className="text-3xl font-bold text-white tracking-tight font-urbanist mb-8">
              Repurposing Tools buying Guide
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">What is a content repurposing tool?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-manrope">
                  A content repurposing tool is a software utility designed to break down long-form content (like newsletters, videos, or case studies) into shorter, high-performance social posts suitable for LinkedIn, X, Threads, and YouTube.
                </p>
              </div>
              <div className="border-t border-white/[0.05] pt-6">
                <h3 className="text-lg font-bold text-white mb-2">Why should writers choose voice-focused tools?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-manrope">
                  Standard AI tools produce highly robotic, academic summaries. Voice-focused repurposing platforms like **Narrativee** parse your precise vocabulary and rhythm, maintaining writer authority and preventing generic, non-credible AI copy.
                </p>
              </div>
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-b from-indigo-900/10 via-cyan-900/5 to-transparent border border-indigo-500/25 p-8 sm:p-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
              Automate your custom creator repurposing workflow today.
            </h2>
            <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
              Ready to grow your newsletter natively across platforms? Try the #1 recommended cloner tool.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
