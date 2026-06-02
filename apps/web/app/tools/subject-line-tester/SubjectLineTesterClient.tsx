"use client";

import { useState, useMemo } from "react";
import { LandingHeader } from "../../components/landing";
import Footer from "../../components/commons/Footer";
import { 
  Sparkles, 
  Check, 
  Copy, 
  AlertTriangle, 
  ThumbsUp, 
  Gauge, 
  Info,
  ArrowRight,
  RefreshCw
} from "lucide-react";

// Curated Power Words list
const POWER_WORDS = [
  "secret", "secrets", "reveal", "proven", "hack", "hacks", "free", "easy", 
  "guaranteed", "convert", "boost", "grow", "mistake", "mistakes", "wrong", 
  "shocking", "urgent", "last", "chance", "discover", "now", "why", "how", "ultimate"
];

// Spam Trigger Words list
const SPAM_WORDS = [
  "buy", "cash", "earn", "income", "million", "billion", "100%", "click", 
  "guaranteed", "refund", "credit", "card", "spam", "dollars", "winner", 
  "selected", "urgent", "debt", "risk", "free", "no", "cost"
];

export default function SubjectLineTesterClient() {
  const [subject, setSubject] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Analysis function
  const analysis = useMemo(() => {
    if (!subject.trim()) {
      return {
        score: 0,
        length: 0,
        lengthScore: 0,
        spamCount: 0,
        spamDetected: [] as string[],
        powerCount: 0,
        powerDetected: [] as string[],
        sentiment: "Neutral",
        capsPercentage: 0,
        feedback: [] as { text: string; status: "success" | "warning" | "error" }[],
        variations: [] as string[]
      };
    }

    const trimmed = subject.trim();
    const length = trimmed.length;
    const words = trimmed.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ""));
    
    // 1. Length scoring (35 to 55 chars is optimal)
    let lengthScore = 100;
    let lengthStatus: "success" | "warning" | "error" = "success";
    let lengthFeedback = "Perfect length! Your subject line fits mobile and desktop screens perfectly.";
    
    if (length < 20) {
      lengthScore = 60;
      lengthStatus = "warning";
      lengthFeedback = "A bit too short. Consider adding more context or a power word.";
    } else if (length > 55 && length <= 70) {
      lengthScore = 80;
      lengthStatus = "warning";
      lengthFeedback = "Slightly long. It might get cut off on some mobile email apps.";
    } else if (length > 70) {
      lengthScore = 40;
      lengthStatus = "error";
      lengthFeedback = "Too long! Subject lines over 70 characters will be truncated on most devices.";
    }

    // 2. Spam Word checking
    const spamDetected = SPAM_WORDS.filter(word => words.includes(word));
    const spamCount = spamDetected.length;
    const spamStatus = spamCount > 0 ? "error" : "success";
    const spamFeedback = spamCount > 0 
      ? `Avoid spam words: "${spamDetected.slice(0, 3).join(", ")}" can trigger email spam filters.` 
      : "Excellent: No common email spam triggers detected.";

    // 3. Power Word checking
    const powerDetected = POWER_WORDS.filter(word => words.includes(word));
    const powerCount = powerDetected.length;
    const powerStatus = powerCount > 0 ? "success" : "warning";
    const powerFeedback = powerCount > 0 
      ? `Nice job! Using power words ("${powerDetected.join(", ")}") boosts emotional clickability.`
      : "Try adding a curiosity or power word to increase open rates.";

    // 4. CAPS and Exclamation checking
    const capsWords = trimmed.split(/\s+/).filter(w => w === w.toUpperCase() && w.length > 1);
    const capsPercentage = trimmed.length > 0 ? (capsWords.length / trimmed.split(/\s+/).length) * 100 : 0;
    const hasExclamation = trimmed.includes("!");
    
    let capitalizationStatus: "success" | "warning" | "error" = "success";
    let capitalizationFeedback = "Capitalization is perfectly balanced.";
    if (capsPercentage > 40) {
      capitalizationStatus = "error";
      capitalizationFeedback = "Too many capitalized words! This feels like shouting and hurts deliverability.";
    } else if (hasExclamation && trimmed.split("!").length > 2) {
      capitalizationStatus = "warning";
      capitalizationFeedback = "Multiple exclamation marks can look unprofessional and trigger spam filters.";
    }

    // 5. Sentiment analysis
    let sentiment = "Neutral";
    const positiveWords = ["grow", "boost", "win", "easy", "love", "perfect", "proven"];
    const urgencyWords = ["now", "urgent", "today", "alert", "warning", "fast", "limited"];
    const curiosityWords = ["secret", "secrets", "why", "shocking", "reveal", "hide", "what"];

    if (words.some(w => curiosityWords.includes(w))) {
      sentiment = "Curiosity-Driven";
    } else if (words.some(w => urgencyWords.includes(w))) {
      sentiment = "Urgent";
    } else if (words.some(w => positiveWords.includes(w))) {
      sentiment = "Inspiring / Positive";
    }

    // Compute aggregate score
    let score = 100;
    score -= (100 - lengthScore) * 0.4;
    score -= spamCount * 20;
    if (powerCount === 0) score -= 15;
    if (capsPercentage > 40) score -= 20;
    if (hasExclamation && trimmed.split("!").length > 2) score -= 10;
    
    score = Math.max(35, Math.min(100, Math.round(score)));

    // Generate smart variations
    const cleanSubject = trimmed.replace(/[.!?]+$/, "");
    const variations = [
      `Secret inside: ${cleanSubject}?`,
      `Why ${cleanSubject.charAt(0).toLowerCase() + cleanSubject.slice(1)} is changing everything`,
      `Don't miss this: ${cleanSubject} (Time-sensitive)`
    ];

    // Collect feedback array
    const feedbackList = [
      { text: lengthFeedback, status: lengthStatus },
      { text: spamFeedback, status: spamStatus },
      { text: powerFeedback, status: powerStatus },
      { text: capitalizationFeedback, status: capitalizationStatus }
    ];

    return {
      score,
      length,
      lengthScore,
      spamCount,
      spamDetected,
      powerCount,
      powerDetected,
      sentiment,
      capsPercentage,
      feedback: feedbackList,
      variations
    };
  }, [subject]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 60) return "text-yellow-500 stroke-yellow-500 border-yellow-500/20 bg-yellow-500/10";
    return "text-red-500 stroke-red-500 border-red-500/20 bg-red-500/10";
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return "#10b981"; // emerald-500
    if (score >= 60) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-manrope">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-1/4 top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#483BFF]/20 blur-[100px]" />
        <div className="absolute right-1/4 bottom-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#36A5FF]/10 blur-[100px]" />
      </div>

      <LandingHeader />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full relative z-10">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border border-zinc-800 bg-zinc-900 text-zinc-400 mb-4">
            <Sparkles size={12} className="text-[#36A5FF]" />
            <span>Free Creative Tools</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-urbanist bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent tracking-tight">
            Email Subject Line Grader
          </h1>
          <p className="text-zinc-400 mt-4 text-base md:text-lg">
            Optimize your newsletter open rates instantly. Put in your draft subject line to see an analytical grade and get AI variations that prompt actions.
          </p>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input and Variations */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md">
              <h2 className="text-lg font-semibold font-urbanist text-zinc-100 mb-4 flex items-center gap-2">
                <span>Enter Your Subject Line</span>
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 5 secrets about newsletter growth that gurus hide..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#483BFF] transition-all"
                />
                <span className={`absolute right-4 bottom-4 text-xs font-semibold ${subject.length > 55 ? 'text-yellow-500' : 'text-zinc-500'}`}>
                  {subject.length}/100
                </span>
              </div>

              {/* Subject Guidelines */}
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-850 pt-4">
                <span className="flex items-center gap-1">
                  <Info size={12} />
                  Mobile Ideal: 35–45 characters
                </span>
                <span>Avoid excessive CAPITALIZATION or exclamation marks!</span>
              </div>
            </div>

            {/* AI Generated High Converting Variants */}
            {subject.trim() && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#36A5FF]" />
                  <span>AI Optimized Alternative Subject Lines</span>
                </h3>
                <div className="flex flex-col gap-3">
                  {analysis.variations.map((variant, index) => (
                    <div 
                      key={index}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-850 bg-zinc-950 p-3.5 hover:border-zinc-700 transition-colors"
                    >
                      <div className="text-sm text-zinc-200 leading-relaxed text-left font-medium">
                        {variant}
                      </div>
                      <button
                        onClick={() => handleCopy(variant, index)}
                        className="rounded-lg p-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer text-zinc-400 flex items-center justify-center shrink-0"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Score Circle and Detailed Stats */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {!subject.trim() ? (
              // Empty State Dashboard Placeholder
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-8 text-center backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
                <div className="rounded-full bg-zinc-950 border border-zinc-800 p-4 mb-4 text-zinc-600">
                  <Gauge size={32} />
                </div>
                <h3 className="text-base font-semibold text-zinc-400">Analysis Dashboard</h3>
                <p className="text-xs text-zinc-600 max-w-xs mt-2 leading-relaxed">
                  Enter your draft subject line on the left side to get a fully interactive real-time score card and actionable copy critique.
                </p>
              </div>
            ) : (
              // Active Dashboard Content
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 backdrop-blur-md flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-base font-semibold text-zinc-200 border-b border-zinc-850 pb-3 flex items-center justify-between">
                  <span>Openability Score</span>
                  <span className="text-xs text-zinc-500 font-normal">Updated Live</span>
                </h3>

                {/* score Radial Gauge */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative flex items-center justify-center w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="stroke-zinc-800"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke={getScoreStroke(analysis.score)}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={376.9}
                        strokeDashoffset={376.9 - (376.9 * analysis.score) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold font-urbanist text-zinc-100">
                        {analysis.score}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        out of 100
                      </span>
                    </div>
                  </div>

                  <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border font-semibold ${getScoreColor(analysis.score)}`}>
                    <span>
                      {analysis.score >= 80 ? "Highly Optimized" : analysis.score >= 60 ? "Needs Polish" : "Weak Subject Line"}
                    </span>
                  </div>
                </div>

                {/* Score Key Indicators */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-3">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                      Length Chars
                    </div>
                    <div className="text-base font-extrabold text-zinc-200 mt-1">
                      {analysis.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-3">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                      Emotional Tone
                    </div>
                    <div className="text-xs font-extrabold text-[#36A5FF] mt-1.5 truncate">
                      {analysis.sentiment}
                    </div>
                  </div>
                </div>

                {/* Detailed Checklist Critiques */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Detailed Diagnostics
                  </h4>
                  <div className="flex flex-col gap-2">
                    {analysis.feedback.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start text-xs leading-relaxed text-zinc-400">
                        <div className="shrink-0 mt-0.5">
                          {item.status === "success" ? (
                            <div className="rounded-full bg-emerald-500/10 p-0.5 text-emerald-500">
                              <ThumbsUp size={12} />
                            </div>
                          ) : item.status === "warning" ? (
                            <div className="rounded-full bg-yellow-500/10 p-0.5 text-yellow-500">
                              <AlertTriangle size={12} />
                            </div>
                          ) : (
                            <div className="rounded-full bg-red-500/10 p-0.5 text-red-500">
                              <AlertTriangle size={12} />
                            </div>
                          )}
                        </div>
                        <div className="text-left font-medium">
                          {item.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
