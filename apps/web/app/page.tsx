"use client"

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { authClient } from "../lib/auth-client";
import {
  Calendar, MessageSquare, Sparkles, BarChart3,
  ArrowRight, ChevronRight, Check, Zap, TrendingUp,
  Clock, Repeat2, Heart, Eye, Users, Puzzle, Bot, Book
} from "lucide-react";
import homepage from "../public/homepage.png";
import { AnimatePresence } from "framer-motion";
import Header from "./components/commons/Header";
import Footer from "./components/commons/Footer";
import PrimaryButton from "./components/commons/PrimaryButton";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-[15px] md:text-base font-semibold text-gray-100 font-urbanist pr-8">
          {question}
        </span>
        <ChevronRight
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-60 pb-5" : "max-h-0"}`}>
        <p className="text-gray-400 text-[15px] leading-relaxed font-manrope pr-12">
          {answer}
        </p>
      </div>
    </div>
  );
}



function AnimatedSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Calendar,
    title: "Scheduled Notes",
    description: "Schedule a week of notes in one click. Queue up your entire content calendar at once — our Chrome extension auto-publishes each note at exactly the right time.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Sparkles,
    title: "AI Note Generation",
    description: "Generate notes in bulk that sound exactly like you. Our AI studies your existing posts and clones your writing voice — not generic AI slop.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Bot,
    title: "Engagement Autopilot",
    description: "Pull trending notes from your feed, generate smart comments, and post them with one click. Grow your visibility on autopilot.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: TrendingUp,
    title: "Inspiration Library",
    description: "Save viral notes from Substack, tag them, and add them to your queue when you're ready. Never run out of content ideas.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Book,
    title: "Knowledge Base",
    description: "Train your AI agent on your unique writing style, publication info, and custom rules. Your agent gets smarter with every post.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Connect your Substack",
    description: "Enter your profile URL. We import your publication info, writing style, and learn your voice from existing posts.",
    accent: "bg-primary",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Create & generate notes",
    description: "Write notes manually or let AI bulk-generate them in your voice. Pick a tone, choose a topic, and get a week's worth of content in seconds.",
    accent: "bg-primary",
  },
  {
    step: "03",
    icon: Clock,
    title: "Schedule & auto-publish",
    description: "Drop notes into time slots on your calendar. Our Chrome extension auto-publishes them at the exact time — no manual posting.",
    accent: "bg-primary",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Engage & grow",
    description: "Use Engagement Autopilot to comment on trending notes and grow your visibility. Track your metrics and iterate.",
    accent: "bg-primary",
  },
];

const STATS = [
  { value: "10×", label: "Faster content creation" },
  { value: "< 2min", label: "Setup time" },
  { value: "24/7", label: "Auto-publishing" },
  { value: "0", label: "Manual posting needed" },
];

export default function Home() {
  const router = useRouter();
  const [rotationIndex, setRotationIndex] = useState(0);
  const namesRotation = ["actionnable data", "smart insights", "auto scheduling"];
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % namesRotation.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [namesRotation.length]);

  return (
    <div className="bg-[#0d0d0f] overflow-hidden">
      <Header />

      {/* ─── HERO ─────────────────────────────────────── */}
      <main className="container mx-auto">
        <section className="relative grid grid-cols-1 lg:grid-cols-2 items-center">
          {/* Subtle gradient background */}


          <div className="flex flex-col items-start  pt-16 md:pt-24 pb-16 px-4 ">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-[80px] text-start font-medium text-gray-100 leading-[1.05] tracking-tight font-urbanist"
            >
              Grow faster on Substack with{" "}
              <span className="relative inline-block min-w-[1.2em] h-[1.1em] align-top overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={namesRotation[rotationIndex]}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="block text-transparent bg-clip-text bg-primary"
                  >
                    {namesRotation[rotationIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 text-start max-w-2xl mt-6 font-manrope leading-relaxed"
            >
              Schedule notes, generate content in your voice, automate engagement,
              and track what works, all from one dashboard.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-10"
            >
              <PrimaryButton
                onClick={() => {
                  session ? router.push("/workspace") : router.push("/auth/signup");
                }}
                className="px-8 py-3 text-base pulse-cta"
              >
                {session ? "Dashboard" : "Start for Free"}
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </PrimaryButton>
              <button
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-gray-400 font-medium text-base hover:text-gray-100 transition-colors font-manrope flex items-center gap-2"
              >
                See how it works
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
            <div className="flex items-center gap-3 text-gray-400 text-lg mt-8 font-manrope font-light">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" alt="Chrome Extension" width={30} height={30} className="rounded-lg" />
              <a href="https://chromewebstore.google.com/detail/narrativee/cahjgmdjjpihnbhiinmabdcjpppflmni" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm hover:text-white transition-colors">Download the official Narrativee extension</a>
            </div>
          </div>

          {/* Hero Dashboard Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="overflow-hidden"
          >
            {/* Dashboard preview content goes here */}
            <Image src={homepage} alt="Homepage" width={1500} height={1500} className="rounded-lg" />
          </motion.div>
        </section>
        {/* ─── STATS BAR ─────────────────────────────────── */}
        <AnimatedSection className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1 font-manrope font-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* ─── PROBLEM SECTION ─────────────────────────────── */}
        <section className="py-16 md:py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-100 font-urbanist leading-tight max-w-3xl mx-auto">
                Growing on Substack is a full-time job
              </h2>
              <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto font-manrope">
                You know you need to post notes consistently, engage with other creators,
                and study what works — but who has time for all that?
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                "You forget to post notes or run out of ideas mid-week",
                "Engaging with other creators takes hours you don't have",
                "You don't know which notes perform best or why",
                "Your content sounds generic because you're writing in a rush",
              ].map((problem, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-red-950/20 border border-red-900/30">
                    <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-400 text-sm font-bold">✕</span>
                    </div>
                    <p className="text-gray-300 font-manrope text-[15px] leading-relaxed">
                      {problem}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES GRID ─────────────────────────────── */}
        <section id="features" className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-medium text-gray-100 font-urbanist leading-tight">
                Your Substack growth toolkit
              </h2>
              <p className="text-gray-400 text-lg mt-4 max-w-xl mx-auto font-manrope font-light">
                Everything you need to create, schedule, engage, and grow without the grind.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <AnimatedSection key={i} delay={i * 0.08}>
                  <div
                    className={`group p-7 rounded-2xl border border-[#2e3033] bg-[#1a1b1c] hover:border-primary/50 transition-all duration-300 h-full`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-[#2a2b2d] flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors duration-300`}>
                      <feature.icon className={`w-6 h-6 text-gray-300 group-hover:text-primary transition-colors`} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-100 font-urbanist mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-[15px] leading-relaxed font-manrope font-light">
                      {feature.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURE SHOWCASE ──────────────────────────── */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto flex flex-col gap-24">

            {/* 1 — Post Queue */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-semibold text-primary font-manrope tracking-wide">Schedule a week of notes in one click</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Post Queue</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Your content calendar, fully automated
                  </h3>
                  <p className="text-gray-400 text-lg font-manrope leading-relaxed font-light">
                    Drag notes onto your calendar, pick a publish time, and let the Chrome extension handle posting. Write once, publish forever.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Visual drag-and-drop scheduling", "Chrome extension auto-publishes", "Batch-create a week of content in minutes"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-300 font-manrope text-[15px] font-light">
                        <Check className="w-4 h-4 text-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#2e3033] bg-[#1a1b1c] p-2">
                  <Image src="/postQueue.png" alt="Narrativee Post Queue" width={800} height={500} className="w-full h-auto rounded-xl border border-[#2e3033]" />
                </div>
              </div>
            </AnimatedSection>

            {/* 2 — AI Note Generation */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-[#2e3033] bg-[#1a1b1c] p-2">
                  <Image src="/Notesgeneration.png" alt="Narrativee AI Note Generation" width={800} height={500} className="w-full h-auto rounded-xl border border-[#2e3033]" />
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">AI Generation</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    A week of notes, generated in seconds
                  </h3>
                  <p className="text-gray-400 text-lg font-manrope leading-relaxed font-light">
                    Pick a topic, choose your tone, and get notes that genuinely sound like you — not generic AI. Our model learns from your real posts.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Voice cloning from your existing posts", "Tone & length controls", "Bulk generation, 10 notes at once"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-300 font-manrope text-[15px] font-light">
                        <Check className="w-4 h-4 text-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            {/* 3 — Engagement Autopilot */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Engagement Autopilot</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Grow your visibility without lifting a finger
                  </h3>
                  <p className="text-gray-400 text-lg font-manrope leading-relaxed font-light">
                    Pull trending notes from your Substack feed, generate smart human-sounding comments, and post them with one click.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Feed scraping via Chrome extension", "AI comments that sound human", "One-click posting to Substack"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-300 font-manrope text-[15px] font-light">
                        <Check className="w-4 h-4 text-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#2e3033] bg-[#1a1b1c] p-2">
                  <Image src="/Enagagement.png" alt="Narrativee Engagement Autopilot" width={800} height={500} className="w-full h-auto rounded-xl border border-[#2e3033]" />
                </div>
              </div>
            </AnimatedSection>

            {/* 4 — Knowledge Base */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-[#2e3033] bg-[#1a1b1c] p-2">
                  <Image src="/knowledgebase.png" alt="Narrativee Knowledge Base" width={800} height={500} className="w-full h-auto rounded-xl border border-[#2e3033]" />
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Knowledge Base</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Train your agent on your unique voice
                  </h3>
                  <p className="text-gray-400 text-lg font-manrope leading-relaxed font-light">
                    Connect your Substack, add custom writing rules, and define your brand persona. Your AI agent learns exactly how you think and write.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Direct training on your Substack posts", "Custom AI writing rules", "Persona & style definitions"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-300 font-manrope text-[15px] font-light">
                        <Check className="w-4 h-4 text-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            {/* 5 — Inspirations */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Inspiration Library</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Never run out of content ideas
                  </h3>
                  <p className="text-gray-400 text-lg font-manrope leading-relaxed font-light">
                    Save viral notes from any Substack with one click, tag them by topic, and pull them into your queue when inspiration strikes.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Save any note from Substack instantly", "Tag & filter by topic or format", "Direct \"Add to Queue\" from your library"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-300 font-manrope text-[15px] font-light">
                        <Check className="w-4 h-4 text-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#2e3033] bg-[#1a1b1c] p-2">
                  <Image src="/inspiration.png" alt="Narrativee Inspiration Library" width={800} height={500} className="w-full h-auto rounded-xl border border-[#2e3033]" />
                </div>
              </div>
            </AnimatedSection>

          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────── */}
        <section id="how-it-works" className="py-16 md:py-24 bg-gray-900/40 -mx-[1.5%] px-[calc(1.5%+1rem)]">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-100 font-urbanist leading-tight">
                Up and running in minutes
              </h2>
              <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto font-manrope">
                Connect your Substack, install the Chrome extension, and start
                scheduling, it's that simple.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {HOW_IT_WORKS.map((item, i) => (
                <AnimatedSection key={i} delay={i * 0.12}>
                  <div className="relative bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${item.accent} text-white text-sm font-bold mb-5`}>
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 font-urbanist mb-3 flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-500" />
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-[15px] leading-relaxed font-manrope">
                      {item.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SOLUTION / DIFFERENTIATOR ─────────────────── */}
        <section id="solution" className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-100 font-urbanist leading-tight max-w-3xl mx-auto">
                Built for Substack creators by a creator
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Big card — AI voice cloning */}
              <AnimatedSection className="lg:col-span-2">
                <div className="relative h-full bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/80 rounded-3xl p-10 md:p-12 text-white overflow-hidden border border-gray-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                  <div className="relative z-10">
                    <Sparkles className="w-10 h-10 text-blue-400 mb-6" />
                    <h3 className="text-2xl md:text-3xl font-bold font-urbanist mb-4">
                      AI that actually sounds like you
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed font-manrope max-w-lg">
                      Our AI reads your existing Substack posts and learns your sentence rhythm,
                      vocabulary, and tone. The generated notes aren't "AI-inspired", they're
                      indistinguishable from what you'd write yourself.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-8">
                      {["Voice cloning", "Tone control", "Anti-AI-slop filter"].map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-medium font-manrope"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Side cards */}
              <div className="flex flex-col gap-8">
                <AnimatedSection delay={0.1}>
                  <div className="bg-amber-950/30 rounded-3xl p-8 border border-amber-900/30 h-full">
                    <MessageSquare className="w-8 h-8 text-amber-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-100 font-urbanist mb-2">
                      Smart Engagement
                    </h3>
                    <p className="text-gray-400 text-[15px] font-manrope leading-relaxed">
                      AI-generated comments that sound human, not spammy. Trained with
                      banned phrases and tone rules so you never look like a bot.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={0.2}>
                  <div className="bg-emerald-950/30 rounded-3xl p-8 border border-emerald-900/30 h-full">
                    <Zap className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-100 font-urbanist mb-2">
                      Zero Manual Posting
                    </h3>
                    <p className="text-gray-400 text-[15px] font-manrope leading-relaxed">
                      The Chrome extension handles everything: auto-publishing notes,
                      scraping feeds, posting comments. You just set it and forget it.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ + CTA ─────────────────────────────────── */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-100 font-urbanist leading-tight">
                Frequently Asked Questions
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="space-y-1">
                <FAQItem
                  question="How does the Chrome extension work?"
                  answer="After installing the extension and logging in, it runs silently in the background. It auto-publishes your scheduled notes at the exact time you set, scrapes your Substack feed for engagement opportunities, and posts AI-generated comments, all from your real Substack account."
                />
                <FAQItem
                  question="Will the AI-generated notes sound like me?"
                  answer="Yes. Our AI reads your existing Substack posts and learns your sentence rhythm, vocabulary, tone, and style. It doesn't generate generic content, it clones your voice so the notes are indistinguishable from what you'd write yourself. You can also pick a tone (casual, professional, witty, etc.) to fine-tune."
                />
                <FAQItem
                  question="Is this safe for my Substack account?"
                  answer="Absolutely. The extension interacts with Substack through your browser the same way you would manually. There's no API abuse or automation that violates Substack's terms. It's like having an assistant who clicks the buttons for you."
                />
                <FAQItem
                  question="Can I edit notes before they're published?"
                  answer="Of course. Every generated note lands in your Post Queue as a draft. You can edit, rewrite, reschedule, or delete any note before it goes live. Nothing publishes without being in your calendar first."
                />
                <FAQItem
                  question="What if I don't have a Substack yet?"
                  answer="You'll need an active Substack publication to use Narrativee. The onboarding process connects to your existing profile and publication URL. If you're just getting started on Substack, create your publication first, then come back, we'll be here."
                />
                <FAQItem
                  question="Is there a free plan?"
                  answer="Yes, you can start for free with limited features. Check out our pricing page for details on what's included in each plan."
                />
              </div>
            </AnimatedSection>

            {/* Compact CTA */}
            <AnimatedSection delay={0.2} className="mt-16 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-100 font-urbanist mb-3">
                Ready to grow on Substack?
              </h3>
              <p className="text-gray-400 font-manrope mb-6">
                Join now and start creating, scheduling, and engaging on autopilot.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <PrimaryButton
                  onClick={() => router.push("/auth/signup")}
                  className="px-8 py-3 text-base"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </PrimaryButton>
                <Link
                  href="/pricing"
                  className="text-gray-500 hover:text-gray-200 font-medium text-base transition-colors font-manrope flex items-center gap-2"
                >
                  View pricing
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}