"use client";

import { FileText, ExternalLink, Check, X, Globe, Type, MousePointerClick, Users, Image } from "lucide-react";
import type { AuditScores, CrawledData } from "../../../actions/audit";

interface LandingPageAuditProps {
  readonly scores: AuditScores;
  readonly crawledData: CrawledData;
  readonly url: string;
}

/** Returns stroke hex for score bar fills */
function getBarColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

/** Returns text color class */
function getTextColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

interface ScoreBarProps {
  readonly label: string;
  readonly score: number;
  readonly icon: React.ReactNode;
}

function ScoreBar({ label, score, icon }: ScoreBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">{icon}</span>
          <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${getTextColor(score)}`}>
          {score}
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: getBarColor(score) }}
        />
      </div>
    </div>
  );
}

/** Boolean indicator row */
function MetaRow({ label, value, detail }: { label: string; value: boolean; detail?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-zinc-800/40 last:border-0">
      <div className={`mt-0.5 shrink-0 ${value ? "text-emerald-400" : "text-red-400"}`}>
        {value ? <Check size={12} /> : <X size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] text-zinc-400 font-medium block">{label}</span>
        {detail && (
          <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">{detail}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Landing page audit section showing category score bars
 * and crawled metadata evidence panel.
 */
export default function LandingPageAudit({ scores, crawledData, url }: LandingPageAuditProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Scores */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-6 backdrop-blur-md print:border-zinc-200 print:bg-white">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-5 flex items-center gap-2 print:text-black">
          <Globe size={13} className="text-[#36A5FF]" />
          Category Breakdown
        </h3>

        <div className="space-y-4">
          <ScoreBar
            label="Landing Page & CTA"
            score={scores.landingPage}
            icon={<MousePointerClick size={12} />}
          />
          <ScoreBar
            label="Headline & Value Prop"
            score={scores.headline}
            icon={<Type size={12} />}
          />
          <ScoreBar
            label="Social Proof & Trust"
            score={scores.socialProof}
            icon={<Users size={12} />}
          />
          <ScoreBar
            label="SEO & Discoverability"
            score={scores.seo}
            icon={<Globe size={12} />}
          />
          <ScoreBar
            label="Content Preview"
            score={scores.contentPreview}
            icon={<FileText size={12} />}
          />
        </div>
      </div>

      {/* Crawled Metadata Evidence */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-6 backdrop-blur-md print:border-zinc-200 print:bg-white">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-5 flex items-center gap-2 print:text-black">
          <FileText size={13} className="text-[#36A5FF]" />
          Crawled Page Evidence
        </h3>

        <div className="space-y-0">
          {/* URL */}
          <div className="flex items-start gap-2.5 py-2 border-b border-zinc-800/40">
            <ExternalLink size={12} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-zinc-400 font-medium block">Target URL</span>
              <span className="text-[10px] text-zinc-300 font-mono block mt-0.5 truncate">{url}</span>
            </div>
          </div>

          {/* H1 */}
          <div className="flex items-start gap-2.5 py-2 border-b border-zinc-800/40">
            <Type size={12} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-zinc-400 font-medium block">Headline (H1)</span>
              <span className="text-[10px] text-zinc-300 italic block mt-0.5">
                {crawledData.h1Text ? `"${crawledData.h1Text}"` : "Not detected"}
              </span>
            </div>
          </div>

          {/* Button */}
          <div className="flex items-start gap-2.5 py-2 border-b border-zinc-800/40">
            <MousePointerClick size={12} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-zinc-400 font-medium block">CTA Button</span>
              <span className="text-[10px] text-zinc-300 italic block mt-0.5">
                {crawledData.buttonText ? `"${crawledData.buttonText}"` : "Not detected"}
              </span>
            </div>
          </div>

          <MetaRow
            label="Email Input Found"
            value={crawledData.hasEmailInput}
            detail={crawledData.hasEmailInput ? `${crawledData.totalInputs} visible field(s)` : undefined}
          />
          <MetaRow
            label="Social Proof Present"
            value={crawledData.hasSocialProof}
            detail={crawledData.socialProofKeywords.length > 0 ? crawledData.socialProofKeywords.slice(0, 4).join(", ") : undefined}
          />
          <MetaRow
            label="OG Share Image"
            value={crawledData.ogImageExists}
          />
          <MetaRow
            label="Past Issues / Archive"
            value={crawledData.hasArchiveLink}
          />
          <MetaRow
            label="Sending Frequency"
            value={crawledData.estimatedFrequency !== "Unknown"}
            detail={crawledData.estimatedFrequency}
          />
        </div>
      </div>
    </div>
  );
}
