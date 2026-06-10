"use client";

import { useState, useTransition } from "react";
import { Navigation } from "../../components/landing/navigation";
import { FooterSection } from "../../components/landing/footer-section";
import { authClient } from "@/lib/auth-client";
import { auditNewsletter, type AuditResult } from "../../actions/audit";
import { type NicheKey } from "./lib/niche-benchmarks";
import { Lock, Download, RefreshCw, AlertOctagon } from "lucide-react";

// Components
import AuditInputForm from "./components/AuditInputForm";
import CrawlAnimation from "./components/CrawlAnimation";
import ScoreRadial from "./components/ScoreRadial";
import LandingPageAudit from "./components/LandingPageAudit";
import MonetizationProjectionSection from "./components/MonetizationProjection";
import GrowthRecommendations from "./components/GrowthRecommendations";
import AuthGateOverlay from "./components/AuthGateOverlay";

/**
 * Main orchestrator for the Newsletter Growth & Monetization Audit tool.
 * Manages three states: input form, crawl animation, and results dashboard.
 */
export default function NewsletterAuditorClient() {
  // Input state
  const [urlInput, setUrlInput] = useState("");
  const [subscriberCount, setSubscriberCount] = useState("");
  const [openRate, setOpenRate] = useState("");
  const [niche, setNiche] = useState<NicheKey>("tech");

  // Processing state
  const [isPending, startTransition] = useTransition();
  const [crawlStep, setCrawlStep] = useState(0);

  // Result state
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // Auth state
  const [showAuthGate, setShowAuthGate] = useState(false);
  const session = authClient.useSession();
  const user = session.data?.user;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!urlInput.trim() || !subscriberCount.trim()) return;

    setAuditResult(null);
    setShowBlockedModal(false);
    setCrawlStep(1);

    // Progressive crawl steps for visual feedback
    const timers = [
      setTimeout(() => setCrawlStep(2), 600),
      setTimeout(() => setCrawlStep(3), 1200),
      setTimeout(() => setCrawlStep(4), 1800),
      setTimeout(() => setCrawlStep(5), 2400),
      setTimeout(() => setCrawlStep(6), 3000),
    ];

    startTransition(async () => {
      // Run the network audit and a 3.6-second delay in parallel
      const auditPromise = auditNewsletter({
        url: urlInput,
        subscriberCount: Number(subscriberCount),
        niche,
        openRate: openRate ? Number(openRate) / 100 : undefined,
      });

      const delayPromise = new Promise((resolve) => setTimeout(resolve, 3600));

      try {
        const [result] = await Promise.all([auditPromise, delayPromise]);

        if (result.success) {
          setAuditResult(result);
          setCrawlStep(0);
        } else if (result.isBlocked) {
          setAuditResult(null);
          setCrawlStep(0);
          setShowBlockedModal(true);
        } else {
          alert(result.error || "An error occurred while scanning.");
          setCrawlStep(0);
        }
      } catch (err) {
        alert("An unexpected error occurred during the audit.");
        setCrawlStep(0);
      } finally {
        timers.forEach(clearTimeout);
      }
    });
  };

  const handleNewAudit = () => {
    setAuditResult(null);
    setCrawlStep(0);
    setShowBlockedModal(false);
  };

  const handleDownload = () => {
    if (!user) {
      setShowAuthGate(true);
    } else {
      window.print();
    }
  };

  // ── Render states ─────────────────────────────────────────────────────

  const isShowingResults = auditResult && !isPending && crawlStep === 0;
  const isShowingCrawl = crawlStep > 0;

  return (
    <main className="theme-landing relative min-h-screen font-display overflow-x-hidden text-white selection:bg-[#483BFF]/30 selection:text-white">
      <Navigation />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full relative z-10 print:py-0 print:px-0">

        {/* ── Print Header ─────────────────────────────────────────── */}
        <div className="hidden print:block text-black mb-8 border-b-2 border-zinc-200 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold tracking-tight text-[#483BFF]">NARRATIVEE AUDIT REPORT</span>
            <span className="text-xs text-zinc-500">Generated for: {auditResult?.url}</span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            Newsletter Growth & Monetization Analysis — {auditResult?.input?.subscriberCount?.toLocaleString()} subscribers
          </p>
        </div>

        {/* ── State 1: Input Form ──────────────────────────────────── */}
        {!isShowingResults && !isShowingCrawl && !showBlockedModal && (
          <AuditInputForm
            urlInput={urlInput}
            subscriberCount={subscriberCount}
            openRate={openRate}
            niche={niche}
            isLoading={isPending}
            onUrlChange={setUrlInput}
            onSubscriberChange={setSubscriberCount}
            onOpenRateChange={setOpenRate}
            onNicheChange={setNiche}
            onSubmit={handleSubmit}
          />
        )}

        {/* ── State 2: Crawl Animation ─────────────────────────────── */}
        {isShowingCrawl && <CrawlAnimation step={crawlStep} />}

        {/* ── Blocked Modal ────────────────────────────────────────── */}
        {showBlockedModal && (
          <div className="max-w-md mx-auto rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md mb-12 text-center print:hidden mt-20">
            <AlertOctagon size={36} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-extrabold text-zinc-100 font-display">
              Crawler Blocked
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              The hosting platform blocked our request (Cloudflare or similar protection). Try a different URL or contact us for a manual audit.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => { setShowBlockedModal(false); }}
                className="w-full py-2.5 rounded-lg bg-[#483BFF] text-xs font-semibold text-white hover:bg-[#36A5FF] transition-colors cursor-pointer"
              >
                Try a Different URL
              </button>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="w-full py-2.5 rounded-lg border border-white/5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── State 3: Results Dashboard ───────────────────────────── */}
        {isShowingResults && auditResult.scores && auditResult.crawledData && auditResult.monetization && auditResult.recommendations && (
          <div className="space-y-8 animate-in fade-in duration-300 mt-10">

            {/* Back / New Audit button */}
            <div className="flex items-center justify-between print:hidden">
              <button
                onClick={handleNewAudit}
                className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Run New Audit</span>
              </button>

              <div className="text-right">
                <span className="text-[10px] text-zinc-600 block">
                  {auditResult.input?.subscriberCount?.toLocaleString()} subscribers
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {auditResult.url}
                </span>
              </div>
            </div>

            {/* ── Overall Score + Category Breakdown ───────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Radial gauge */}
              <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-md flex flex-col items-center justify-center text-center print:border-zinc-200 print:bg-white">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-6 print:text-black">
                  Overall Audit Score
                </h3>
                <ScoreRadial score={auditResult.scores.overall} size={170} />
              </div>

              {/* Category breakdown + metadata */}
              <div className="lg:col-span-8">
                <LandingPageAudit
                  scores={auditResult.scores}
                  crawledData={auditResult.crawledData}
                  url={auditResult.url || ""}
                />
              </div>
            </div>

            {/* ── Monetization Projections ─────────────────────────── */}
            {user ? (
              <MonetizationProjectionSection
                monetization={auditResult.monetization}
                subscriberCount={auditResult.input?.subscriberCount || 0}
                niche={auditResult.input?.niche || "other"}
              />
            ) : (
              <AuthGateOverlay
                title="Unlock Monetization Projections"
                description="Create a free account to see your sponsorship, paid subscription, and affiliate revenue potential with detailed breakdowns."
                onRequestAuth={() => setShowAuthGate(true)}
              >
                {/* Dummy content behind blur */}
                <div className="space-y-4 p-4">
                  <div className="flex justify-between">
                    <div className="h-5 bg-zinc-800 rounded w-40" />
                    <div className="h-12 bg-zinc-800 rounded w-28" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-32 bg-zinc-800 rounded" />
                    <div className="h-32 bg-zinc-800 rounded" />
                    <div className="h-32 bg-zinc-800 rounded" />
                  </div>
                  <div className="h-16 bg-zinc-800 rounded" />
                </div>
              </AuthGateOverlay>
            )}

            {/* ── Brand CTA Banner ─────────────────────────────────── */}
            <div
              className="rounded-2xl border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 print:hidden relative overflow-hidden group hover:border-[#483BFF]/40 transition-all duration-500 bg-cover bg-center"
              style={{
                backgroundImage: 'linear-gradient(to right, rgba(4, 2, 20, 0.94), rgba(9, 5, 34, 0.19)), url("/images/bridge.png")'
              }}
            >
              {/* Highlight background glow */}
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none group-hover:bg-[#483BFF]/15 transition-all duration-500" />

              <div className="relative z-10 flex-1 space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#36A5FF]/20 bg-[#36A5FF]/5 px-2.5 py-0.5 text-[9px] text-[#36A5FF] font-semibold uppercase tracking-wider">
                  Acquisition Accelerator
                </span>
                <h3 className="text-lg md:text-2xl font-light font-display text-white">
                  Turn Your Newsletter Into A Multi-Channel Traffic Engine
                </h3>
                <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  Writing a great newsletter is only half the battle. If you aren't actively promoting it, it won't grow. Use Narrativee to automatically transform your newsletter drafts into high-performing carousels and posts for LinkedIn, X (Twitter), and Threads to drive consistent signups on autopilot.
                </p>
              </div>

              <div className="relative z-10 shrink-0">
                <a
                  href={user ? "/workspace" : "/auth/signup"}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-bold text-black hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl"
                >
                  <span>{user ? "Go to Dashboard" : "Start automate your content distribution for free"}</span>
                  <span className="text-lg">→</span>
                </a>
              </div>
            </div>

            {/* ── Growth Recommendations ───────────────────────────── */}
            <GrowthRecommendations
              recommendations={auditResult.recommendations}
              isLocked={!user}
              visibleCount={4}
            />

            {/* ── PDF Download Button ─────────────────────────────── */}
            <div className="flex justify-center print:hidden pt-2 pb-4">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#483BFF] to-[#36A5FF] px-8 py-4 font-bold text-sm text-white hover:opacity-95 hover:shadow-lg hover:shadow-[#483BFF]/10 transition-all cursor-pointer"
              >
                {!user ? <Lock size={15} /> : <Download size={15} />}
                <span>Download Full Audit Report</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Auth Gate Modal ──────────────────────────────────────── */}
        {showAuthGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm print:hidden animate-in fade-in duration-200">
            <div className="relative max-w-sm w-full rounded-2xl border border-white/5 bg-zinc-950 p-6 md:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">

              <div className="mx-auto w-12 h-12 rounded-full bg-[#483BFF]/10 border border-[#483BFF]/20 flex items-center justify-center text-[#36A5FF] mb-4">
                <Lock size={20} />
              </div>

              <h3 className="text-xl font-extrabold text-zinc-100 font-display">
                Unlock Your Full Audit Report
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Create a free account to access monetization projections, all growth recommendations, and download your complete PDF report.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href="/auth/signup?redirect=/tools/newsletter-auditor"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#483BFF] to-[#36A5FF] text-xs font-bold text-white hover:opacity-90 transition-all block text-center"
                >
                  Create Free Account
                </a>
                <a
                  href="/auth/signin?redirect=/tools/newsletter-auditor"
                  className="w-full py-3 rounded-xl border border-white/5 bg-zinc-900/40 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors block text-center"
                >
                  Sign In
                </a>
              </div>

              <button
                onClick={() => setShowAuthGate(false)}
                className="mt-6 text-zinc-600 hover:text-zinc-400 text-[10px] tracking-wide uppercase font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </main>
    </main>
  );
}
