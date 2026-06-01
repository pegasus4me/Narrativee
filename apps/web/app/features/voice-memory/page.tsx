import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BrainCircuit, CheckCircle2, MessageSquareHeart, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { LandingHeader } from "../../components/landing";

export const metadata: Metadata = {
  title: "AI Voice Cloner & Memory Engine for Writers",
  description: "Clones your exact writing voice per platform. Train your custom model on past articles and saved posts to generate authentic copies instead of generic summaries.",
  alternates: {
    canonical: "/features/voice-memory",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/features/voice-memory",
    siteName: "Narrativee",
    title: "AI Voice Cloner & Memory Engine for Writers | Narrativee",
    description: "Tired of dry, robotic AI drafts? Train Narrativee's dynamic Voice Memory studio on your own newsletters and keep your authentic writer voice alive.",
  },
};

export default function VoiceMemoryPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden pb-24">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 opacity-80 z-0">
        <div className="absolute left-1/2 top-[-10rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[20rem] h-[30rem] w-[30rem] rounded-full bg-zinc-500/10 blur-3xl" />
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
              <span>Proprietary Voice Memory Matrix</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white font-urbanist leading-[1.05]">
              AI that actually writes in your voice.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl">
              Generic LLMs write in a dry, academic, and highly predictable style. 
              Narrativee operates differently. Our custom Voice Memory engine parses your past newsletter issues and saved writing samples to reverse-engineer your precise vocabulary, formatting style, sentence lengths, and hooks.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Train My AI Voice
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

          {/* Voice Engine Diagram Box */}
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-urbanist">
                The multi-channel voice graph.
              </h2>
              <p className="mt-6 text-zinc-400 leading-relaxed">
                You write differently depending on where you post. Your X presence might be contrarian and punchy, while your LinkedIn posts are analytical and deeply formatted. 
                Narrativee allows you to store **separate style profiles** for every single platform. We train each channel profile using your own distinct samples.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Analyzes syntax, sentence length distribution, and vocabulary",
                  "Preserves unique industry jargon, acronyms, and formatting styles",
                  "Dynamic channel memory keeps X punchy and LinkedIn structured",
                  "Continuous learning updates profile each time you edit a draft"
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Compounding Voice Diagram block */}
            <div className="p-6 sm:p-8 rounded-[2rem] border border-white/5 bg-zinc-950/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[80px]" />
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <BrainCircuit className="h-4.5 w-4.5 text-indigo-400" />
                Active Voice Parameters
              </h3>
              
              <div className="space-y-4">
                {[
                  { name: "Hook Aggressiveness", value: "85%" },
                  { name: "Jargon/Industry Density", value: "62%" },
                  { name: "Formatting Structure", value: "Bullets / Spacing" },
                  { name: "Average Sentence Length", value: "Short (12 words)" },
                  { name: "Call-to-Action Softness", value: "Comment Link Trigger" }
                ].map((param) => (
                  <div key={param.name} className="flex justify-between items-center text-xs border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
                    <span className="text-zinc-500 font-medium">{param.name}</span>
                    <span className="text-indigo-300 font-bold font-manrope">{param.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Core Voice Capabilities */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-urbanist">
                Engineered for serious writers.
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                <Wand2 className="h-10 w-10 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Syntax Mimicking</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Our system breaks down how you structure arguments. Do you start with a question? Do you use one-sentence paragraphs? Narrativee maps your syntax blueprint.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                <MessageSquareHeart className="h-10 w-10 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Slang & Jargon Memory</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Never correct a generic AI again for omitting your brand catchphrases. Add your custom blacklist, whitelist, and vocabulary presets directly to your Voice Memory Studio.
                </p>
              </div>

              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                <RefreshCw className="h-10 w-10 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Compounding Feedback</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Every edit you make to a draft inside the Narrativee editor updates your voice matrix. Over time, the drafts require less editing, compounding your workflow efficiency.
                </p>
              </div>
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-b from-indigo-900/10 via-zinc-900/5 to-transparent border border-indigo-500/25 p-8 sm:p-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
              Ready to clone your unique writing profile?
            </h2>
            <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
              Establish a multi-channel content system that sounds exactly like you. Start your free trial today.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Train My AI Voice Now
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
