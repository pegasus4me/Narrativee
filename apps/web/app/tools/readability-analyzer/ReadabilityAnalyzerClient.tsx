"use client";

import { useState, useMemo } from "react";
import { LandingHeader } from "../../components/landing";
import Footer from "../../components/commons/Footer";
import { 
  BookOpen, 
  Sparkles, 
  Hourglass, 
  PenTool, 
  Check, 
  Eye,
  Info,
  Layers,
  ArrowRight
} from "lucide-react";

export default function ReadabilityAnalyzerClient() {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "heatmap">("edit");

  // Readability analysis calculations
  const stats = useMemo(() => {
    if (!text.trim()) {
      return {
        wordCount: 0,
        charCount: 0,
        sentenceCount: 0,
        readTimeSeconds: 0,
        gradeLevel: 0,
        sentences: [] as { text: string; length: number; level: "easy" | "hard" | "very-hard" }[],
        complexCount: 0,
        hardCount: 0,
        veryHardCount: 0
      };
    }

    const trimmed = text.trim();
    
    // Clean text and split words
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const charCount = trimmed.length;

    // Split sentences using regex matching punctuation (. ? !)
    // We filter empty sentences
    const sentenceArr = trimmed
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
    const sentenceCount = sentenceArr.length || 1;

    // 1. Estimated read time: Average ~200 WPM
    const readTimeMinutes = wordCount / 200;
    const readTimeSeconds = Math.round(readTimeMinutes * 60);

    // 2. Syllable count & readability approximation (Flesch-Kincaid inspired)
    // Count syllable by vowel sequences (vowels in english: a e i o u y)
    let totalSyllables = 0;
    let complexCount = 0; // words with >= 3 syllables
    
    words.forEach(w => {
      const cleanWord = w.toLowerCase().replace(/[^a-z]/g, "");
      // simple syllable counting regex
      let count = (cleanWord.match(/[aeiouy]{1,2}/g) || []).length;
      
      // adjust for silent 'e' at end
      if (cleanWord.endsWith("e") && count > 1) {
        count--;
      }
      
      totalSyllables += Math.max(1, count);
      if (count >= 3) {
        complexCount++;
      }
    });

    // Grade Level formula approximation:
    // Grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    let gradeLevel = 0.39 * (wordCount / sentenceCount) + 11.8 * (totalSyllables / wordCount) - 15.59;
    gradeLevel = Math.max(1, Math.min(18, Math.round(gradeLevel)));

    // 3. Sentence complexity classification
    let hardCount = 0;
    let veryHardCount = 0;

    const classifiedSentences = sentenceArr.map(s => {
      const sWords = s.split(/\s+/).filter(w => w.length > 0).length;
      let level: "easy" | "hard" | "very-hard" = "easy";
      
      if (sWords > 25) {
        level = "very-hard";
        veryHardCount++;
      } else if (sWords > 18) {
        level = "hard";
        hardCount++;
      }

      return {
        text: s,
        length: sWords,
        level
      };
    });

    return {
      wordCount,
      charCount,
      sentenceCount,
      readTimeSeconds,
      gradeLevel,
      sentences: classifiedSentences,
      complexCount,
      hardCount,
      veryHardCount
    };
  }, [text]);

  const formatReadTime = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getGradeDescription = (grade: number) => {
    if (grade === 0) return null;
    if (grade <= 6) return { title: "Elementary", css: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10", desc: "Very easy to read. Readable by a 5th grader. Great for quick scanning." };
    if (grade <= 9) return { title: "Standard / Ideal", css: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10", desc: "Optimal newsletter level. Readable by an 8th grader. Conversational and engaging." };
    if (grade <= 12) return { title: "High School Level", css: "text-yellow-500 border-yellow-500/20 bg-yellow-500/10", desc: "Moderately complex. Ideal for technical or highly analytical content." };
    return { title: "Academic / Hard", css: "text-red-500 border-red-500/20 bg-red-500/10", desc: "Very hard to read. High density of complex sentences. Consider rewriting to keep readers hooked." };
  };

  const gradeInfo = getGradeDescription(stats.gradeLevel);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-manrope">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute left-1/3 top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#36A5FF]/10 blur-[100px]" />
        <div className="absolute right-1/3 bottom-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#483BFF]/10 blur-[100px]" />
      </div>

      <LandingHeader />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full relative z-10">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border border-zinc-800 bg-zinc-900 text-zinc-400 mb-4">
            <BookOpen size={12} className="text-[#483BFF]" />
            <span>Free Editorial Tools</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-urbanist bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent tracking-tight">
            Readability & Read-Time Analyzer
          </h1>
          <p className="text-zinc-400 mt-4 text-base md:text-lg">
            Ensure your newsletter copy is sharp, crisp, and easy to read. Paste your draft to instantly compute skimmability metrics and identify complex sentences.
          </p>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Editor / Visual Heatmap */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${activeTab === "edit" ? "border-[#483BFF] text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                <PenTool size={14} />
                <span>Write / Paste Copy</span>
              </button>
              <button
                onClick={() => setActiveTab("heatmap")}
                disabled={!text.trim()}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${text.trim() ? "cursor-pointer" : ""} ${activeTab === "heatmap" ? "border-[#483BFF] text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                <Eye size={14} />
                <span>Sentence Heatmap</span>
                {text.trim() && (stats.hardCount + stats.veryHardCount > 0) && (
                  <span className="rounded-full bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 text-[10px] text-red-400 font-bold">
                    {stats.hardCount + stats.veryHardCount}
                  </span>
                )}
              </button>
            </div>

            {activeTab === "edit" ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md">
                <textarea
                  placeholder="Paste your newsletter draft copy here to start analyzing word counts, reading time, and clarity..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-80 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
                />
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-850 pt-4">
                  <span className="flex items-center gap-1">
                    <Info size={12} />
                    Tips: Aim for an 8th-grade level for high engagement newsletters.
                  </span>
                  <span>{stats.charCount} characters</span>
                </div>
              </div>
            ) : (
              // Heatmap Mode
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md min-h-[380px] flex flex-col justify-between">
                <div className="text-sm leading-relaxed text-zinc-300 text-left font-medium space-y-2 select-text">
                  {stats.sentences.map((sentence, idx) => {
                    let highlightClass = "";
                    if (sentence.level === "very-hard") {
                      highlightClass = "bg-red-500/25 text-red-200 border-b border-red-500/40 cursor-help px-1 rounded-sm";
                    } else if (sentence.level === "hard") {
                      highlightClass = "bg-yellow-500/20 text-yellow-100 border-b border-yellow-500/40 cursor-help px-1 rounded-sm";
                    } else {
                      highlightClass = "hover:bg-zinc-800/40 px-0.5 transition-colors rounded-sm";
                    }

                    return (
                      <span 
                        key={idx} 
                        className={`${highlightClass} mr-1.5 inline-block`}
                        title={sentence.level !== "easy" ? `${sentence.length} words - consider shortening` : ""}
                      >
                        {sentence.text}
                      </span>
                    );
                  })}
                </div>

                {/* Heatmap Legend */}
                <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t border-zinc-850 pt-4 text-xs">
                  <div className="flex gap-4 items-center">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded bg-red-500/30 border border-red-500/50 block shrink-0" />
                      Very Hard (&gt;25 words)
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded bg-yellow-500/30 border border-yellow-500/50 block shrink-0" />
                      Hard (18–25 words)
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700 block shrink-0" />
                      Simple (&lt;18 words)
                    </span>
                  </div>
                  <span className="text-zinc-500 font-medium">Click "Write / Paste Copy" tab to edit.</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dashboard Stats Card */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {!text.trim() ? (
              // Empty State Dashboard Placeholder
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-8 text-center backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
                <div className="rounded-full bg-zinc-950 border border-zinc-800 p-4 mb-4 text-zinc-600">
                  <Hourglass size={32} />
                </div>
                <h3 className="text-base font-semibold text-zinc-400">Editorial Dashboard</h3>
                <p className="text-xs text-zinc-600 max-w-xs mt-2 leading-relaxed">
                  Enter your draft text in the editor on the left to measure metrics, count syllables, and test skimmability.
                </p>
              </div>
            ) : (
              // Active Dashboard Content
              <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 backdrop-blur-md flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-base font-semibold text-zinc-200 border-b border-zinc-850 pb-3 flex items-center justify-between">
                  <span>Clarity Analytics</span>
                  <span className="text-xs text-zinc-500 font-normal">Real-time Analysis</span>
                </h3>

                {/* Main scoring panels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-4 text-left">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                      Estimated Read Time
                    </span>
                    <span className="text-2xl font-extrabold text-[#36A5FF] mt-2 block font-urbanist">
                      {formatReadTime(stats.readTimeSeconds)}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-1 block">
                      Based on 200 WPM speed
                    </span>
                  </div>

                  <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-4 text-left">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                      Readability Grade
                    </span>
                    <span className="text-2xl font-extrabold text-white mt-2 block font-urbanist">
                      {stats.gradeLevel === 0 ? "—" : `Grade ${stats.gradeLevel}`}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-1 block">
                      Flesch-Kincaid estimate
                    </span>
                  </div>
                </div>

                {/* Grade Evaluation Description */}
                {gradeInfo && (
                  <div className={`rounded-xl border p-4 text-left ${gradeInfo.css}`}>
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      {gradeInfo.title}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                      {gradeInfo.desc}
                    </p>
                  </div>
                )}

                {/* Raw statistics checklists */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850 pb-1 text-left">
                    Document Breakdown
                  </h4>
                  
                  <div className="space-y-2.5 text-xs text-zinc-400">
                    <div className="flex justify-between items-center">
                      <span>Total Words</span>
                      <span className="font-semibold text-zinc-200">{stats.wordCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Sentences</span>
                      <span className="font-semibold text-zinc-200">{stats.sentenceCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Sentence Length</span>
                      <span className="font-semibold text-zinc-200">
                        {stats.sentenceCount > 0 ? (stats.wordCount / stats.sentenceCount).toFixed(1) : 0} words
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Complex Words (3+ Syllables)</span>
                      <span className="font-semibold text-zinc-200">{stats.complexCount}</span>
                    </div>
                  </div>
                </div>

                {/* Highlight Diagnostics alert */}
                {(stats.hardCount + stats.veryHardCount > 0) && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex gap-3 items-start text-xs text-zinc-400">
                    <div className="shrink-0 mt-0.5 rounded-full bg-yellow-500/10 p-0.5 text-yellow-500">
                      <Info size={12} />
                    </div>
                    <div className="text-left font-medium">
                      Found <strong className="text-white">{stats.hardCount + stats.veryHardCount} hard-to-read</strong> sentences. Use the **Sentence Heatmap** tab to locate and trim them down.
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
