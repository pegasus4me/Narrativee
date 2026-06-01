import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Copy, Layers, MessageSquare, Share2, Sparkles } from "lucide-react";
import { LandingHeader } from "../../components/landing";

export const metadata: Metadata = {
  title: "Repurpose Newsletters into Social Content Automatically",
  description: "Turn one newsletter issue into platform-native posts for LinkedIn, X, Threads, Instagram, and Bluesky. Retain your voice and expand your reach automatically.",
  alternates: {
    canonical: "/features/newsletter-to-social",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/features/newsletter-to-social",
    siteName: "Narrativee",
    title: "Repurpose Newsletters into Social Content Automatically | Narrativee",
    description: "Build a multi-channel native content workflow. Turn newsletter articles into engagement magnets matching each channel's formatting rules.",
  },
};

export default function NewsletterToSocialPage() {
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
          {/* Breadcrumb / Back Link */}
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
          <div className="max-w-4xl mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Channel Content Compiling</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white font-urbanist leading-[1.05]">
              One newsletter issue.<br />Ten social drafts.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl">
              Writing a great newsletter takes hours of deep research. Don't let that value die in the inbox. 
              Narrativee decomposes your articles, extracts sharp content angles, and translates them into natively formatted posts optimized for LinkedIn, X, Threads, and more.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Repurpose My Newsletter
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/[0.08]"
              >
                View Plans & Pricing
              </Link>
            </div>
          </div>

          {/* Mockup Showcase - Interactive visual feel */}
          <section className="mb-24">
            <div className="border border-white/10 rounded-[2.5rem] bg-zinc-950/60 p-8 sm:p-12 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-indigo-500/5 rounded-full blur-[100px]" />
              
              <div className="grid gap-12 lg:grid-cols-12 items-stretch">
                {/* Column 1: Input source */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Step 1: Input</span>
                    <h3 className="text-2xl font-bold text-white tracking-tight mt-2 font-urbanist">
                      The Newsletter Article
                    </h3>
                    <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                      You write your comprehensive newsletter issue once. Narrativee ingests the article and extracts key metrics, quotes, contrarian viewpoints, and practical checklists.
                    </p>
                  </div>
                  
                  {/* Visual representation of an article card */}
                  <div className="mt-8 border border-white/5 bg-white/[0.02] p-5 rounded-2xl">
                    <div className="h-2 w-1/3 bg-zinc-700 rounded-full mb-3" />
                    <div className="h-4 w-3/4 bg-white/10 rounded-full mb-5" />
                    <div className="space-y-2">
                      <div className="h-2.5 w-full bg-zinc-800 rounded-full" />
                      <div className="h-2.5 w-full bg-zinc-800 rounded-full" />
                      <div className="h-2.5 w-5/6 bg-zinc-800 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Column 2: Process separator */}
                <div className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center relative">
                  <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                  <div className="absolute h-10 w-10 rounded-xl bg-indigo-500 border border-indigo-400/20 text-white flex items-center justify-center">
                    <Share2 className="h-4 w-4" />
                  </div>
                </div>

                {/* Column 3: Custom native outputs */}
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">Step 2: Platform-Native Compiles</span>
                  
                  {/* LinkedIn post preview card */}
                  <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.02]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-cyan-400">LinkedIn Post</span>
                      <span className="text-[10px] text-zinc-500">Professional, high-value, structured</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-manrope">
                      🚀 <strong>The Hidden Moat in Newsletter Growth...</strong><br />
                      Most creators fail because they treat every platform as the same surface. Here is how top operators distribute:
                    </p>
                  </div>

                  {/* X Thread preview card */}
                  <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-indigo-400">X Thread Draft</span>
                      <span className="text-[10px] text-zinc-500">Hooks, contrarian, spacing, punchy</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-manrope">
                      1/ ChatGPT is making your writing boring.<br /><br />
                      If you're using generic prompts to write your posts, you're competing on noise. Here is a 3-step pipeline to extract sharper social angles: 👇
                    </p>
                  </div>

                  {/* Threads preview card */}
                  <div className="p-5 rounded-2xl border border-pink-500/20 bg-pink-500/[0.02]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-pink-400">Threads Post</span>
                      <span className="text-[10px] text-zinc-500">Conversational, audience question</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-manrope">
                      What's your biggest pain point when trying to share your newsletter ideas on social media? For me, it's formatting threads. Let's discuss.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Deep Feature Highlights */}
          <section className="mb-24">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                <Layers className="h-10 w-10 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Multi-Angle Decomposition</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Instead of copying and pasting summaries, Narrativee isolates key arguments and constructs distinct angles (e.g. *Contrarian hooks, Bullet lists, Deep case-studies*) suited to different platform mentalities.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                <MessageSquare className="h-10 w-10 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Strict Platform Constraints</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Narrativee adapts automatically to length boundaries, line break configurations, emojis, and specific CTA triggers (like placing links in the comments or thread footer) for each channel.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                <Copy className="h-10 w-10 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Compounding Voice Engine</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Your LinkedIn presence stays professional and structured while your X posts remain punchy and active. All drafts retain the context of your original article, eliminating generic "hallucinations."
                </p>
              </div>
            </div>
          </section>

          {/* Detailed benefits table */}
          <section className="border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-24">
            <h2 className="text-3xl font-bold text-white tracking-tight font-urbanist mb-8">
              Why manual repurposing holds you back.
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-white/10">
                  <tr>
                    <th className="py-4">Feature</th>
                    <th className="py-4 px-4 text-white">Narrativee Compiler</th>
                    <th className="py-4">Manual / ChatGPT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  <tr>
                    <td className="py-4 font-semibold text-zinc-300">Time per Newsletter</td>
                    <td className="py-4 px-4 text-cyan-400 font-semibold">Under 10 minutes</td>
                    <td className="py-4">1.5 to 2 hours of editing</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-semibold text-zinc-300">Channel Personalization</td>
                    <td className="py-4 px-4 text-cyan-400 font-semibold">Built-in per platform rules</td>
                    <td className="py-4">Requires rewriting everything manually</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-semibold text-zinc-300">Context Memory</td>
                    <td className="py-4 px-4 text-cyan-400 font-semibold">Compounds across all posts</td>
                    <td className="py-4">Forgotten as soon as chat ends</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-semibold text-zinc-300">AI Hallucinations</td>
                    <td className="py-4 px-4 text-cyan-400 font-semibold">None (Strict anchor parameters)</td>
                    <td className="py-4">Prone to making up random "facts"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-b from-indigo-900/10 via-cyan-900/5 to-transparent border border-indigo-500/25 p-8 sm:p-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
              Stop letting your best newsletter ideas go to waste.
            </h2>
            <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
              Extract every ounce of value from your hard work. Compile platform-native drafts in minutes.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Repurpose My Next Issue
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
