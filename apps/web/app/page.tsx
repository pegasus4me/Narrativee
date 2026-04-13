"use client"
//style={{ backgroundImage: "radial-gradient(ellipse at center, #fb923c 0%, #ea580c 100%)" }}
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { authClient } from "../lib/auth-client";
import engagement from "../public/engagement.png";
import {
  MessageSquare, Sparkles, ArrowRight, ChevronRight,
  Zap, Calendar, BarChart3, BookOpen, Target, Check, Plus
} from "lucide-react";
import Header from "./components/commons/Header";
import Footer from "./components/commons/Footer";
import PrimaryButton from "./components/commons/PrimaryButton";
import postqueue from "../public/post.png";
import campaigns from "public/campaigns.png"
import substackLogo from "public/substack_logo.png"
function AnimatedSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.07]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-gray-100 font-urbanist pr-8">{question}</span>
        <Plus className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-60 pb-5" : "max-h-0"}`}>
        <p className="text-gray-400 text-[15px] leading-relaxed font-manrope pr-8">{answer}</p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Target,
    label: "Campaign Autopilot",
    title: "Turn commenters into subscribers — automatically",
    description: "Build reply campaigns targeting commenters on high-traffic notes. Set your sequence, define a daily quota, and let StackReach handle outreach while you track conversions live.",
    image: "/campaigns.png",
    span: "col-span-2",
  },
  {
    icon: Sparkles,
    label: "AI Generation",
    title: "A week of notes in seconds",
    description: "Voice cloning from your real posts. Bulk-generate 10 notes at once.",
    image: "/calendarGrid.png",
    span: "col-span-1",
  },
  {
    icon: Calendar,
    label: "Post Queue",
    title: "Your content calendar, fully automated",
    description: "Drag notes onto your calendar. Chrome extension handles publishing.",
    image: null,
    imageComponent: postqueue,
    span: "col-span-1",
  },
  {
    icon: MessageSquare,
    label: "Engagement Autopilot",
    title: "Grow visibility without lifting a finger",
    description: "Pull trending notes, generate human-sounding comments, post with one click.",
    image: null,
    imageComponent: engagement,
    span: "col-span-1",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    title: "Know exactly what's working",
    description: "Subscriber growth, engagement trends, best time to post — all in one view.",
    image: "/analytics.png",
    span: "col-span-1",
  },
  {
    icon: BookOpen,
    label: "Inspiration Library",
    title: "Never run out of ideas",
    description: "Save viral notes from any Substack, tag by topic, pull into your queue.",
    image: "/inspiration.png",
    span: "col-span-1",
  },
];

const LOGOS = ["Substack", "Chrome", "OpenAI", "Vercel", "Stripe"];


export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <div className="bg-[#161819] text-white overflow-hidden">
      <Header />

      <main>

        {/* ─── HERO ─────────────────────────────────────────── */}
        <section className="relative pt-24 pb-16 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="text-5xl md:text-6xl font-extrabold uppercase text-white leading-[1.05] tracking-tight font-urbanist mb-4"
            >
              
              The all-in-one growth tool{" "}
              <br className="hidden md:block" />
              for <span className="bg-clip-text  text-white/50">Substack writers</span>
              <Image src={substackLogo} alt="Substack" width={68} height={68} className="inline-block ml-3 mb-1 rounded-xl align-middle" />
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="text-lg md:text-xl text-white max-w-2xl mx-auto font-manrope leading-relaxed mb-4"
            >
              The all-in-one toolkit that automates your content, amplifies your visibility, and grows your newsletter on autopilot.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
            >
              <PrimaryButton
                onClick={() => session ? router.push("/workspace") : router.push("/auth/signup")}
                className="px-8 py-3.5 text-base font-bold"
              >
                {session ? "Go to Dashboard" : "Start for Free"}
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </PrimaryButton>
              <PrimaryButton
                onClick={() => router.push("https://chromewebstore.google.com/detail/narrativee/hgokdadgfhfioepbogddoaofopahgkhj")}
                className="bg-transparent w-fit border-white/10 hover:bg-white/10 text-gray-400 hover:text-white font-medium text-base transition-colors font-manrope flex items-center gap-1.5 px-6 py-3.5"
              >
<img
                                src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg"
                                alt="Chrome"
                                className="w-5 h-5"
                            />
                Download the extension
              </PrimaryButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center gap-3 mb-16"
            >
            <p className="text-gray-600 text-sm font-manrope">7-day free trial · No credit card required</p>
            </motion.div>

            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.35 }}
              className="relative rounded-2xl overflow-hidden shadow-lg border border-white/[0.07] p-2"
            >
              <iframe
                src="https://customer-qusdy8i1rves1ask.cloudflarestream.com/0f1674d204460b2341c841f80cd8b413/iframe?autoplay=true&muted=true&loop=true&controls=false&preload=true"
                className="w-full aspect-video rounded-xl"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </div>
        </section>

        {/* ─── STATS ────────────────────────────────────────── */}
        <AnimatedSection className="py-14 border-y border-white/[0.06]">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "10×", label: "Faster content creation" },
                { value: "< 2min", label: "Setup time" },
                { value: "24/7", label: "Auto-publishing" },
                { value: "0", label: "Manual posting" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-4xl md:text-5xl font-bold text-white font-urbanist">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1 font-manrope">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* ─── PROBLEM ──────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <AnimatedSection className="mb-12">
              <p className="text-xs font-bold text-primary uppercase tracking-widest font-manrope mb-4">Why we built this</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist leading-tight mb-5">
                Growing on Substack is a full-time job
              </h2>
              <p className="text-gray-400 text-lg font-manrope leading-relaxed max-w-2xl">
                I hit a wall trying to grow my own Substack. Posting consistently, engaging with other writers, figuring out what actually worked — it was eating hours I didn&apos;t have. So I built the tool I wished existed.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <Image src="/profile.jpg" alt="Founder" width={44} height={44} className="rounded-full object-cover border border-white/10" />
                <div>
                  <p className="text-gray-300 text-sm font-semibold font-manrope">Safoan, founder of StackReach</p>
                  <a href="https://safoan.substack.com" target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline font-manrope">safoan.substack.com</a>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Running out of note ideas mid-week and posting nothing",
                "Spending hours on engagement that barely moves the needle",
                "No idea which notes resonate and which ones flop",
                "Writing in a rush and sounding like everyone else",
              ].map((p, i) => (
                <AnimatedSection key={i} delay={i * 0.07}>
                  <div className="flex items-start gap-3 p-5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <span className="text-red-500/70 font-bold mt-0.5 shrink-0">✕</span>
                    <p className="text-gray-400 font-manrope text-[15px] leading-relaxed">{p}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES BENTO ───────────────────────────────── */}
        <section id="features" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <AnimatedSection className="text-center mb-16">
              <p className="text-xs font-bold text-primary uppercase tracking-widest font-manrope mb-4">Everything you need</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist leading-tight mb-4">
                Six tools. One dashboard.
              </h2>
              <p className="text-gray-400 text-lg font-manrope max-w-xl mx-auto">
                StackReach bundles every tool Substack writers need to grow — without juggling six different apps.
              </p>
            </AnimatedSection>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Large card — Campaigns */}
              <AnimatedSection className="lg:col-span-2">
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden flex flex-col">
                  <div className="p-8 pb-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest font-manrope mb-3">
                      <Target className="w-3 h-3" /> Campaign Autopilot
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white font-urbanist leading-tight mb-2">
                      Turn commenters into subscribers — automatically
                    </h3>
                    <p className="text-gray-500 text-[15px] font-manrope leading-relaxed mb-6">
                      Build reply campaigns targeting commenters on high-traffic notes. Set your sequence, define a daily quota, and track conversions live.
                    </p>
                  </div>
                  <div className="mt-auto overflow-hidden">
                    <Image src="/campaigns.png" alt="Campaign Autopilot" width={800} height={450} className="w-full h-auto" />
                  </div>
                </div>
              </AnimatedSection>

              {/* AI Generation */}
              <AnimatedSection delay={0.05}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden flex flex-col">
                  <div className="p-8 pb-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest font-manrope mb-3">
                      <Sparkles className="w-3 h-3" /> AI Generation
                    </span>
                    <h3 className="text-lg font-bold text-white font-urbanist mb-2">A week of notes in seconds</h3>
                    <p className="text-gray-500 text-[14px] font-manrope leading-relaxed mb-6">Voice cloning from your real posts. Bulk-generate 10 notes at once in your exact tone.</p>
                  </div>
                  <div className="mt-auto overflow-hidden">
                    <Image src="/calendarGrid.png" alt="AI Generation" width={500} height={300} className="w-full h-auto" />
                  </div>
                </div>
              </AnimatedSection>

              {/* Post Queue */}
              <AnimatedSection delay={0.1}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden flex flex-col">
                  <div className="p-8 pb-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest font-manrope mb-3">
                      <Calendar className="w-3 h-3" /> Post Queue
                    </span>
                    <h3 className="text-lg font-bold text-white font-urbanist mb-2">Your content calendar, fully automated</h3>
                    <p className="text-gray-500 text-[14px] font-manrope leading-relaxed mb-6">Drag notes onto your calendar. Chrome extension auto-publishes at exact time.</p>
                  </div>
                  <div className="mt-auto overflow-hidden">
                    <Image src={postqueue} alt="Post Queue" width={500} height={300} className="w-full h-auto" />
                  </div>
                </div>
              </AnimatedSection>

              {/* Engagement */}
              <AnimatedSection delay={0.12}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden flex flex-col">
                  <div className="p-8 pb-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest font-manrope mb-3">
                      <MessageSquare className="w-3 h-3" /> Engagement Autopilot
                    </span>
                    <h3 className="text-lg font-bold text-white font-urbanist mb-2">Grow visibility without lifting a finger</h3>
                    <p className="text-gray-500 text-[14px] font-manrope leading-relaxed mb-6">Pull trending notes, generate human-sounding comments, post with one click.</p>
                  </div>
                  <div className="mt-auto overflow-hidden">
                    <Image src={engagement} alt="Engagement Autopilot" width={500} height={300} className="w-full h-auto" />
                  </div>
                </div>
              </AnimatedSection>

              {/* Analytics */}

              {/* AI voice card */}
              <AnimatedSection delay={0.18}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-gradient-to-br from-primary/10 to-transparent p-8 flex flex-col">
                  <Sparkles className="w-7 h-7 text-primary mb-5" />
                  <h3 className="text-lg font-bold text-white font-urbanist mb-2">AI that sounds like you</h3>
                  <p className="text-gray-400 text-[14px] font-manrope leading-relaxed mb-6">
                    Our AI reads your existing posts and learns your sentence rhythm, vocabulary, and tone. Generated notes are indistinguishable from your own writing.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {["Voice cloning", "Tone control", "Anti-AI-slop"].map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold font-manrope text-primary/80">{tag}</span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <AnimatedSection className="text-center mb-16">
              <p className="text-xs font-bold text-primary uppercase tracking-widest font-manrope mb-4">Get started</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist leading-tight">
                Up and running in minutes
              </h2>
              <p className="text-gray-400 text-lg mt-4 max-w-xl mx-auto font-manrope">
                Connect your Substack, install the Chrome extension, and start growing.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { step: "01", title: "Connect your Substack", description: "Enter your profile URL. We import your publication info and learn your voice from existing posts." },
                { step: "02", title: "Generate notes in your voice", description: "Write manually or bulk-generate with AI. Pick a tone, choose a topic, get a week of content in seconds." },
                { step: "03", title: "Schedule & auto-publish", description: "Drop notes into time slots. Our Chrome extension publishes them at the exact time — no manual posting." },
                { step: "04", title: "Engage & grow", description: "Use Engagement Autopilot to comment on trending notes and grow your visibility. Track metrics and iterate." },
              ].map((item, i) => (
                <AnimatedSection key={i} delay={i * 0.08}>
                  <div className="relative p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors h-full group">
                    <div className="text-[64px] font-black text-white/[0.04] font-urbanist leading-none absolute top-4 right-6 select-none group-hover:text-primary/10 transition-colors">
                      {item.step}
                    </div>
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-bold font-urbanist mb-5">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-white font-urbanist mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed font-manrope">{item.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ──────────────────────────────────────── */}
        <section id="pricing" className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <AnimatedSection className="text-center mb-16">
              <p className="text-xs font-bold text-primary uppercase tracking-widest font-manrope mb-4">Pricing</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist leading-tight mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-400 text-lg font-manrope max-w-md mx-auto">
                Start free. Upgrade when you&apos;re ready to scale.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="max-w-2xl mx-auto rounded-2xl border border-primary/30 bg-primary/5 p-8 md:p-12 flex flex-col md:flex-row gap-10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                  Early bird — save 50%
                </div>

                {/* Left: price + cta */}
                <div className="flex flex-col justify-between gap-6 md:min-w-[200px]">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest font-manrope mb-3">Writer</p>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-lg text-primary line-through font-urbanist">$19.99</span>
                      <span className="text-5xl font-bold text-white font-urbanist">$9.99</span>
                    </div>
                    <p className="text-gray-500 text-sm font-manrope mb-1">/ month · first 3 months</p>
                    <p className="text-xs text-primary font-bold font-manrope">Use code <span className="bg-primary text-white px-1.5 py-0.5 rounded">EARLYBIRD26</span></p>
                  </div>
                  <button
                    onClick={() => router.push("/auth/signup")}
                    className="w-full py-3 rounded-xl text-sm font-bold font-manrope bg-primary hover:bg-primary/90 text-white transition-all"
                  >
                    Start your 7-day free trial
                  </button>
                  <p className="text-xs text-gray-600 font-manrope text-center">No credit card required</p>
                </div>

                {/* Right: features */}
                <ul className="flex flex-col gap-3 flex-1">
                  {[
                    "100 AI credits/month",
                    "Profile optimization insights",
                    "40 notes queued simultaneously",
                    "Performance analytics",
                    "Inspiration library",
                    "60 creator follow ups/month",
                    "Priority email support",
                    "Early access to new features",
                    "Cross-post notes to other platforms",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-gray-300 font-manrope text-[14px]">
                      <Check className="w-4 h-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-3xl">
            <AnimatedSection className="text-center mb-14">
              <p className="text-xs font-bold text-primary uppercase tracking-widest font-manrope mb-4">FAQ</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist leading-tight">Common questions</h2>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <div>
                <FAQItem question="How does the Chrome extension work?" answer="After installing and logging in, it runs silently in the background. It auto-publishes your scheduled notes at the exact time you set, scrapes your Substack feed for engagement opportunities, and posts AI-generated comments — all from your real Substack account." />
                <FAQItem question="Will the AI-generated notes sound like me?" answer="Yes. Our AI reads your existing Substack posts and learns your sentence rhythm, vocabulary, tone, and style. It clones your voice so the notes are indistinguishable from what you'd write yourself. You can also pick a tone to fine-tune." />
                <FAQItem question="Is this safe for my Substack account?" answer="Absolutely. The extension interacts with Substack through your browser the same way you would manually. There's no API abuse or automation that violates Substack's terms. It's like having an assistant who clicks the buttons for you." />
                <FAQItem question="Can I edit notes before they're published?" answer="Of course. Every generated note lands in your Post Queue as a draft. You can edit, rewrite, reschedule, or delete any note before it goes live." />
                <FAQItem question="What if I don't have a Substack yet?" answer="You'll need an active Substack publication to use StackReach. If you're just getting started, create your publication first — we'll be here." />
                <FAQItem question="Is there a free plan?" answer="Yes, you can start for free with limited features. Check out our pricing section above for details on what's included in each plan." />
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ─── FINAL CTA ────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-3xl">
            <AnimatedSection>
              <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-transparent to-transparent p-12 md:p-16 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest font-manrope mb-4">Get started today</p>
                  <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist leading-tight mb-4">
                    Ready to grow on Substack?
                  </h2>
                  <p className="text-gray-400 font-manrope text-lg mb-8 max-w-md mx-auto">
                    Join now and start creating, scheduling, and engaging on autopilot.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <PrimaryButton
                      onClick={() => router.push("/auth/signup")}
                      className="px-10 py-4 text-base font-bold"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </PrimaryButton>
                    <Link href="/pricing" className="text-gray-400 hover:text-white font-medium text-base transition-colors font-manrope flex items-center gap-1.5">
                      View pricing <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <p className="text-gray-600 text-sm font-manrope mt-5">7-day free trial · No credit card required</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
