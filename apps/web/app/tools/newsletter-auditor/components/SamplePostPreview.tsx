"use client";

import { Linkedin, ArrowRight, ThumbsUp, MessageSquare, Repeat2, Send } from "lucide-react";
import type { AuditResult } from "../../../actions/audit";

interface SamplePostPreviewProps {
  readonly auditResult: AuditResult;
  readonly onSignup: () => void;
}

const NICHE_HOOKS: Record<string, string[]> = {
  tech: [
    "Most developers are sleeping on this.",
    "Here's what the top 1% of engineers do differently:",
    "I analyzed 100 tech newsletters. Here's what actually drives growth:",
  ],
  finance: [
    "The financial advice nobody tells you:",
    "I've been tracking this trend for 6 months. Here's what I found:",
    "Most investors get this completely wrong:",
  ],
  marketing: [
    "The marketing tactic everyone ignores (but shouldn't):",
    "I tested 50 subject lines. Here's what actually works:",
    "Most brands are leaving subscribers on the table. Here's how to stop:",
  ],
  health: [
    "The wellness advice that actually has science behind it:",
    "I've been researching this for months. The results are surprising:",
    "Most health content gets this backwards:",
  ],
  creator: [
    "The creator economy is changing. Here's what it means for you:",
    "I grew my newsletter to {n} subscribers. Here's the exact framework:",
    "Most creators focus on the wrong metric:",
  ],
  business: [
    "The business insight most founders miss:",
    "I studied 50 fast-growing companies. Here's the pattern:",
    "Most entrepreneurs overcomplicate this:",
  ],
  other: [
    "The insight I wish someone had told me earlier:",
    "Here's what changed everything for my newsletter:",
    "Most people get this completely wrong:",
  ],
};

function generatePost(auditResult: AuditResult): string {
  const niche = auditResult.input?.niche ?? "other";
  const subs = auditResult.input?.subscriberCount ?? 0;
  const h1 = auditResult.crawledData?.h1Text ?? "";
  const desc = auditResult.crawledData?.descText ?? "";
  const freq = auditResult.crawledData?.estimatedFrequency;

  const hooks = NICHE_HOOKS[niche] ?? NICHE_HOOKS.other;
  const hook = (hooks[Math.floor(subs % hooks.length)] ?? hooks[0])
    .replace("{n}", subs.toLocaleString());

  const topRec = auditResult.recommendations?.find(
    (r) => r.priority === "critical" || r.priority === "high"
  );

  const valueLine = h1.length > 10
    ? `My newsletter "${h1}" covers exactly this.`
    : desc.length > 20
      ? desc.slice(0, 100) + (desc.length > 100 ? "..." : "")
      : `I write about ${niche} every ${freq !== "Unknown" ? freq.toLowerCase() : "week"}.`;

  const freqLine = freq && freq !== "Unknown"
    ? `I send it ${freq.toLowerCase()} to ${subs.toLocaleString()}+ subscribers.`
    : `${subs.toLocaleString()}+ subscribers read it every week.`;

  const recLine = topRec
    ? `The #1 thing most newsletters miss: ${topRec.title.toLowerCase().replace(/\.$/, "")}.`
    : "Most newsletters never fix their biggest growth bottleneck.";

  return `${hook}\n\n${valueLine}\n\n${recLine}\n\n${freqLine}\n\nIf you want the full breakdown, link in bio.\n\n↓ Save this for later`;
}

export default function SamplePostPreview({ auditResult, onSignup }: SamplePostPreviewProps) {
  const post = generatePost(auditResult);
  const lines = post.split("\n");

  return (
    <div className="rounded-2xl border border-[#0A66C2]/20 bg-zinc-950/60 p-6 md:p-8 space-y-5 print:hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            <span className="text-xs font-semibold text-[#0A66C2] uppercase tracking-wider">
              Your first LinkedIn post — generated from this audit
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-xl">
            Here's what Narrativee would generate from your newsletter right now. One click to publish.
          </p>
        </div>
      </div>

      {/* Mock LinkedIn card */}
      <div className="rounded-xl border border-white/8 bg-[#1B1F23] p-5 space-y-4">
        {/* Profile row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#483BFF] to-[#36A5FF] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(auditResult.crawledData?.h1Text?.[0] ?? "N").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">You</p>
            <p className="text-[10px] text-zinc-500">Newsletter Creator · Just now</p>
          </div>
        </div>

        {/* Post body */}
        <div className="space-y-2">
          {lines.map((line, i) => (
            <p
              key={i}
              className={`text-sm leading-relaxed ${
                line === "" ? "h-1" : "text-zinc-200"
              } ${i === 0 ? "font-semibold text-white" : ""}`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Fake engagement row */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-zinc-600 text-xs">
          <button type="button" className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors cursor-default">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Like</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors cursor-default">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors cursor-default">
            <Repeat2 className="w-3.5 h-3.5" />
            <span>Repost</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors cursor-default">
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-zinc-500 max-w-sm">
          Narrativee generates posts like this from every newsletter issue — and schedules them automatically to LinkedIn, X, and Threads.
        </p>
        <button
          type="button"
          onClick={onSignup}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#0A66C2]/90 px-5 py-3 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#0A66C2]/20"
        >
          Publish this with Narrativee
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
