"use client"

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { authClient } from "../lib/auth-client";
import engagement from "../public/engagement.png"
import { EarlyBirdBanner } from "./pricing/components/earlyBird";
import {
  MessageSquare, Sparkles, ArrowRight, ChevronRight,
  Zap, TrendingUp, Clock, Users
} from "lucide-react";
import homepage from "../public/analytics.png";
import { AnimatePresence } from "framer-motion";
import Header from "./components/commons/Header";
import Footer from "./components/commons/Footer";
import PrimaryButton from "./components/commons/PrimaryButton";
import narrativee from "../public/narrativee.png";
import { ArrowRightIcon } from "clicons-react";
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

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Connect your Substack",
    description: "Enter your profile URL. We import your publication info, writing style, and learn your voice from existing posts.",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Create & generate notes",
    description: "Write notes manually or let AI bulk-generate them in your voice. Pick a tone, choose a topic, and get a week of content in seconds.",
  },
  {
    step: "03",
    icon: Clock,
    title: "Schedule & auto-publish",
    description: "Drop notes into time slots on your calendar. Our Chrome extension auto-publishes them at the exact time — no manual posting.",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Engage & grow",
    description: "Use Engagement Autopilot to comment on trending notes and grow your visibility. Track your metrics and iterate.",
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
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % namesRotation.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [namesRotation.length]);

  return (
    <div className="bg-[#0d0d0f] overflow-hidden">
      <Header />
      <EarlyBirdBanner />
      {/* ─── HERO ─────────────────────────────────────── */}
      <main className="">
        <section className="container mx-auto relative grid grid-cols-1 lg:grid-cols-2 items-center">
          <div className="flex flex-col items-start pt-16 md:pt-24 pb-16 px-4">
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

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 text-start max-w-2xl mt-6 font-manrope leading-relaxed"
            >
              Schedule notes, generate content in your voice, automate engagement,
              and track what works, all from one dashboard.
            </motion.p>

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

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="overflow-hidden"
          >
            <Image src={homepage} alt="Homepage" width={1500} height={1500} className="rounded-lg" />
          </motion.div>
        </section>

        {/* ─── STATS BAR ─────────────────────────────────── */}
        <AnimatedSection className="py-5 md:py-5 bg-black">
          <div className="grid grid-cols-2 container  mx-auto md:grid-cols-4 gap-8 px-4 ">
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
          <div className="container mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl  text-gray-100 font-urbanist leading-tight max-w-6xl mx-auto">
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

        {/* ─── FEATURE SHOWCASE ──────────────────────────── */}
        <section id="features" className="py-16 md:py-32 px-4">
          <div className="container mx-auto text-center mb-16"> 
            <h1 className="text-6xl flex items-center justify-center gap-4">introducing <Image src={narrativee} alt="Narrativee" width={400} height={100} /></h1>
            <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto font-manrope">
              The all-in-one growth toolkit for Substack creators. Schedule notes, generate content in your voice, automate engagement, and track what works, all from one dashboard.
            </p>
            <a href="https://chromewebstore.google.com/detail/narrativee/cahjgmdjjpihnbhiinmabdcjpppflmni" 
            className="text-primary font-semibold text-sm ">Get chrome extension <ArrowRightIcon className="w-4 h-4 inline-block ml-2" /></a>
          </div>
          <div className="container mx-auto flex flex-col gap-32 ">
              
            {/* 1 — Post Queue */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Post Queue</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Your content calendar, fully automated
                  </h3>
                  <p className="text-gray-500 text-lg font-manrope leading-relaxed font-light">
                    Drag notes onto your calendar, pick a publish time, and let the Chrome extension handle posting. Write once, publish forever.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Visual drag-and-drop scheduling", "Chrome extension auto-publishes", "Batch-create a week of content in minutes"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-400 font-manrope text-[15px] font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <Image src="/postqueue.png" alt="Narrativee Post Queue" width={800} height={500} className="w-full h-auto" />
                </div>
              </div>
            </AnimatedSection>

            {/* 2 — AI Note Generation */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 rounded-xl overflow-hidden border border-white/[0.06]">
                  <Image src="/calendarGrid.png" alt="Narrativee AI Note Generation" width={800} height={500} className="w-full h-auto" />
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">AI Generation</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    A week of notes, generated in seconds
                  </h3>
                  <p className="text-gray-500 text-lg font-manrope leading-relaxed font-light">
                    Pick a topic, choose your tone, and get notes that genuinely sound like you — not generic AI. Our model learns from your real posts.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Voice cloning from your existing posts", "Tone & length controls", "Bulk generation, 10 notes at once"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-400 font-manrope text-[15px] font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            {/* 3 — Engagement Autopilot */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Engagement Autopilot</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Grow your visibility without lifting a finger
                  </h3>
                  <p className="text-gray-500 text-lg font-manrope leading-relaxed font-light">
                    Pull trending notes from your Substack feed, generate smart human-sounding comments, and post them with one click.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Feed scraping via Chrome extension", "AI comments that sound human", "One-click posting to Substack"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-400 font-manrope text-[15px] font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <Image src={engagement} alt="Narrativee Engagement Autopilot" width={800} height={500} className="w-full h-auto" />
                </div>
              </div>
            </AnimatedSection>

            {/* 4 — Knowledge Base */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 rounded-xl overflow-hidden border border-white/[0.06]">
                  <Image src="/knowledgebase.png" alt="Narrativee Knowledge Base" width={800} height={500} className="w-full h-auto" />
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Knowledge Base</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Train your agent on your unique voice
                  </h3>
                  <p className="text-gray-500 text-lg font-manrope leading-relaxed font-light">
                    Connect your Substack, add custom writing rules, and define your brand persona. Your AI agent learns exactly how you think and write.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Direct training on your Substack posts", "Custom AI writing rules", "Persona & style definitions"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-400 font-manrope text-[15px] font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            {/* 5 — Analytics */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Analytics</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Know exactly what&apos;s working
                  </h3>
                  <p className="text-gray-500 text-lg font-manrope leading-relaxed font-light">
                    Track your subscriber growth, engagement trends, and posting activity in one place. Stop guessing and start doubling down on what drives results.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Subscriber growth over time", "Engagement trends by week", "Best time to post insights"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-400 font-manrope text-[15px] font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <Image src="/analytics.png" alt="Narrativee Analytics" width={800} height={500} className="w-full h-auto" />
                </div>
              </div>
            </AnimatedSection>

            {/* 6 — Inspirations */}
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 rounded-xl overflow-hidden border border-white/[0.06]">
                  <Image src="/inspiration.png" alt="Narrativee Inspiration Library" width={800} height={500} className="w-full h-auto" />
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest font-manrope">Inspiration Library</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-gray-100 font-urbanist mt-3 mb-4 leading-tight">
                    Never run out of content ideas
                  </h3>
                  <p className="text-gray-500 text-lg font-manrope leading-relaxed font-light">
                    Save viral notes from any Substack with one click, tag them by topic, and pull them into your queue when inspiration strikes.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Save any note from Substack instantly", "Tag & filter by topic or format", "Direct \"Add to Queue\" from your library"].map(t => (
                      <li key={t} className="flex items-center gap-3 text-gray-400 font-manrope text-[15px] font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────── */}
        <section id="how-it-works" className="py-16 md:py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-medium text-gray-100 font-urbanist leading-tight">
                Up and running in minutes
              </h2>
              <p className="text-gray-500 text-lg mt-4 max-w-2xl mx-auto font-manrope font-light">
                Connect your Substack, install the Chrome extension, and start scheduling.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#111113] h-full">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary text-sm font-bold font-urbanist mb-5">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-medium text-gray-100 font-urbanist mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed font-manrope font-light">
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
              <h2 className="text-3xl md:text-5xl font-medium text-gray-100 font-urbanist leading-tight max-w-3xl mx-auto">
                Built for Substack creators by a creator
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Big card — AI voice cloning */}
              <AnimatedSection className="lg:col-span-2">
                <div className="h-full bg-[#111113] rounded-2xl p-10 md:p-12 border border-white/[0.06]">
                  <Sparkles className="w-8 h-8 text-primary mb-6" />
                  <h3 className="text-2xl md:text-3xl font-medium font-urbanist text-gray-100 mb-4">
                    AI that actually sounds like you
                  </h3>
                  <p className="text-gray-500 text-lg leading-relaxed font-manrope font-light max-w-lg">
                    Our AI reads your existing Substack posts and learns your sentence rhythm,
                    vocabulary, and tone. The generated notes aren&apos;t &ldquo;AI-inspired&rdquo; — they&apos;re
                    indistinguishable from what you&apos;d write yourself.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-8">
                    {["Voice cloning", "Tone control", "Anti-AI-slop filter"].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.06] text-sm font-medium font-manrope text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Side cards */}
              <div className="flex flex-col gap-6">
                <AnimatedSection delay={0.1}>
                  <div className="bg-[#111113] rounded-2xl p-8 border border-white/[0.06] h-full">
                    <MessageSquare className="w-7 h-7 text-primary mb-4" />
                    <h3 className="text-lg font-medium text-gray-100 font-urbanist mb-2">
                      Smart Engagement
                    </h3>
                    <p className="text-gray-500 text-[15px] font-manrope leading-relaxed font-light">
                      AI-generated comments that sound human, not spammy. Trained with
                      banned phrases and tone rules so you never look like a bot.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={0.2}>
                  <div className="bg-[#111113] rounded-2xl p-8 border border-white/[0.06] h-full">
                    <Zap className="w-7 h-7 text-primary mb-4" />
                    <h3 className="text-lg font-medium text-gray-100 font-urbanist mb-2">
                      Zero Manual Posting
                    </h3>
                    <p className="text-gray-500 text-[15px] font-manrope leading-relaxed font-light">
                      The Chrome extension handles everything: auto-publishing notes,
                      scraping feeds, posting comments. Set it and forget it.
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
              <h2 className="text-3xl md:text-5xl font-medium text-gray-100 font-urbanist leading-tight">
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
              <h3 className="text-2xl md:text-3xl font-medium text-gray-100 font-urbanist mb-3">
                Ready to grow on Substack?
              </h3>
              <p className="text-gray-500 font-manrope mb-6 font-light">
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
