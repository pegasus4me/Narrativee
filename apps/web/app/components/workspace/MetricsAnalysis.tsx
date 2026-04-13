"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface Analysis {
    assessment: string;
    insights: string[];
    suggestions: string[];
}

export function MetricsAnalysis() {
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);

    const run = async () => {
        setLoading(true);
        setError(null);
        setCollapsed(false);
        try {
            const res = await fetch(`${API_URL}/notes/ai-analysis`, { credentials: "include" });
            if (!res.ok) {
                const j: any = await res.json().catch(() => ({}));
                throw new Error(j.error ?? `HTTP ${res.status}`);
            }
            const json: any = await res.json();
            setAnalysis(json.analysis);
        } catch (e: any) {
            setError(e.message ?? "Failed to generate analysis");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-violet-800/30 bg-gradient-to-br from-violet-950/30 to-[#1e1f21] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-violet-800/20">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-gray-200">AI Metrics Analysis</span>
                    {analysis && (
                        <span className="text-[10px] text-violet-400 bg-violet-900/40 px-2 py-0.5 rounded-full">Powered by narrativee</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {analysis && (
                        <button
                            onClick={() => setCollapsed(c => !c)}
                            className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                    )}
                    <button
                        onClick={run}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-violet-900/40 text-violet-300 rounded-lg hover:bg-violet-800/50 transition-colors disabled:opacity-50 text-xs font-medium border border-violet-700/40"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                        {loading ? "Analysing..." : analysis ? "Re-analyse" : "Analyse my metrics"}
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading && (
                <div className="px-5 py-8 flex flex-col items-center gap-3 text-gray-500">
                    <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
                    <p className="text-sm">StackReach is analysing your Substack metrics…</p>
                </div>
            )}

            {error && !loading && (
                <div className="px-5 py-4 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {analysis && !loading && !collapsed && (
                <div className="px-5 py-5 flex flex-col gap-5 max-h-80 overflow-y-auto">
                    {/* Assessment */}
                    <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-violet-500 pl-3">
                        {analysis.assessment}
                    </p>

                    {/* Insights */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-3">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Hidden Insights</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {analysis.insights.map((insight, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-300">
                                    <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Suggestions */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Action Plan</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {analysis.suggestions.map((s, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-300">
                                    <span className="w-5 h-5 rounded-full bg-emerald-900/50 text-emerald-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                        {i + 1}
                                    </span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {!analysis && !loading && !error && (
                <div className="px-5 py-6 text-sm text-gray-600 text-center">
                    Click &quot;Analyse my metrics&quot; to get personalised insights powered by Grok AI.
                </div>
            )}
        </div>
    );
}
