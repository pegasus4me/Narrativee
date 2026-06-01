import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Calendar, CheckCircle2, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { LandingHeader } from "../../components/landing";

export const metadata: Metadata = {
  title: "Schedule Substack Notes Automatically",
  description: "Queue, write, and schedule Substack Notes automatically. Reach more readers, keep a compounding content calendar, and automate your Substack growth.",
  alternates: {
    canonical: "/features/substack-notes-scheduler",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://narrativee.com/features/substack-notes-scheduler",
    siteName: "Narrativee",
    title: "Schedule Substack Notes Automatically | Narrativee",
    description: "The first automatic scheduler for Substack Notes. Batch your newsletter repurposing workflow and compound your growth.",
  },
};

export default function SubstackSchedulerPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden pb-24">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 opacity-80 z-0">
        <div className="absolute left-1/2 top-[-10rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[15rem] h-[30rem] w-[30rem] rounded-full bg-indigo-500/10 blur-3xl" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>World's First Substack Notes Scheduler</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white font-urbanist leading-[1.05]">
              Schedule Substack Notes automatically.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-3xl">
              Substack is the best place to build an audience, but it lacks a native tool to queue and schedule Notes. 
              Narrativee fills this gap, helping you write in batches, establish a calendar consistency, and schedule your social content with zero friction.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Start Scheduling Free
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

          {/* The Substack Pain Point Callout */}
          <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr] items-center border border-white/10 rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">The Problem Solver</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-urbanist">
                Why schedule Substack Notes?
              </h2>
              <p className="mt-6 text-zinc-400 leading-relaxed">
                Consistent publishing is the only way to compound subscriber growth on Substack. 
                However, manually posting Notes every day disrupts your focus. With Narrativee, you batch plan a week's worth of Notes in 20 minutes and let our automation do the work.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Never miss peak reading hours again",
                  "Separate batch drafting from daily publishing",
                  "Cross-pollinate your newsletter angles seamlessly",
                  "Maintain growth while you sleep or take time off"
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual Feature highlights */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-purple-500/10 transition-colors">
                <Calendar className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-bold text-white">Visual Calendar</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Plan your posting schedule with a clean, drag-and-drop editorial calendar interface.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-purple-500/10 transition-colors">
                <Zap className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-bold text-white">Angle Generation</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Turn past newsletter posts into dynamic note ideas automatically in one click.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-purple-500/10 transition-colors">
                <ShieldAlert className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-bold text-white">Secure Local Client</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Our companion browser extension automates scheduling from your local Substack session.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-purple-500/10 transition-colors">
                <Sparkles className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-bold text-white">Zero Password Policy</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  We never store your Substack credentials. The Chrome Extension runs entirely locally.
                </p>
              </div>
            </div>
          </section>

          {/* Deep Feature Workflow */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-urbanist">
                Three steps to automated Substack notes.
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Import Your Newsletter",
                  desc: "Connect your feed or paste your latest post. Narrativee parses your text to find core, high-impact quotes."
                },
                {
                  step: "02",
                  title: "Refine & Schedule",
                  desc: "Review compiled Note drafts formatted for length and engagement. Schedule them in your publication's slot."
                },
                {
                  step: "03",
                  title: "Extension Runs Automations",
                  desc: "Our lightweight Chrome companion publishes scheduled queue files natively inside your browser session."
                }
              ].map((item) => (
                <div key={item.step} className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] relative overflow-hidden group hover:border-white/10 transition-colors">
                  <span className="absolute top-4 right-6 text-7xl font-bold text-white/[0.02] group-hover:text-white/[0.04] transition-colors font-urbanist">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-3 mt-4">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent border border-purple-500/25 p-8 sm:p-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-urbanist max-w-2xl mx-auto">
              Take back control of your Substack scheduling.
            </h2>
            <p className="mt-6 text-base text-zinc-400 max-w-lg mx-auto">
              Stop daily manual posting. Write in batches, queue your posts, and watch your subscriber graph grow automatically.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Build My Substack Schedule
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
