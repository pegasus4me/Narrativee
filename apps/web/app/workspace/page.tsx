"use client";

import { useState } from "react";
import { AnalyticsProvider, useAnalytics } from "../components/workspace/AnalyticsProvider";
import { StatsOverview } from "../components/workspace/StatsOverview";
import { SubsChart } from "../components/workspace/SubsChart";
import { ActivityChart } from "../components/workspace/ActivityChart";
import { PerformanceChart } from "../components/workspace/PerformanceChart";
import { PostingHeatmap } from "../components/workspace/PostingHeatmap";
import { PublishSummaryCard } from "../components/workspace/PublishSummaryCard";
import { RefreshCw, Sparkles, X, Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface Analysis {
    assessment: string;
    insights: string[];
    suggestions: string[];
}

const Card = ({ title, subtitle, children, className = "" }: {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-5 ${className}`}>
        {title && (
            <div className="mb-4">
                <p className="text-sm font-semibold text-gray-200">{title}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
        )}
        {children}
    </div>
);

function AnalyticsDashboard() {
    const { loading, lastFetchedAt, refresh } = useAnalytics();

    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const formatLastUpdated = () => {
        if (!lastFetchedAt) return "Never";
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastFetchedAt.getTime()) / 1000);
        if (diff < 10) return "Just now";
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return lastFetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const runAnalysis = async () => {
        setAnalysisLoading(true);
        setAnalysisError(null);
        setShowAnalysis(true);
        try {
            const res = await fetch(`${API_URL}/notes/ai-analysis`, { credentials: "include" });
            if (!res.ok) {
                const j: any = await res.json().catch(() => ({}));
                throw new Error(j.error ?? `HTTP ${res.status}`);
            }
            const json: any = await res.json();
            setAnalysis(json.analysis);
        } catch (e: any) {
            setAnalysisError(e.message ?? "Failed to generate analysis");
        } finally {
            setAnalysisLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-100">Analytics</h1>
                        <p className="text-sm text-gray-500 mt-1">Track your content performance and growth.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastFetchedAt && (
                            <span className="text-xs text-gray-600">
                                Updated {formatLastUpdated()}
                            </span>
                        )}
                        <button
                            onClick={runAnalysis}
                            disabled={analysisLoading}
                            className="flex items-center gap-2 px-3.5 py-2 bg-violet-900/30 text-violet-300 rounded-xl hover:bg-violet-800/40 transition-all disabled:opacity-50 text-xs font-medium border border-violet-700/30"
                        >
                            <Sparkles className={`w-3.5 h-3.5 ${analysisLoading ? "animate-pulse" : ""}`} />
                            {analysisLoading ? "Analysing…" : "Analyse my stats"}
                        </button>
                        <button
                            onClick={refresh}
                            disabled={loading}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 text-xs font-medium border border-white/[0.06]"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                            {loading ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* AI Analysis Panel */}
                {showAnalysis && (
                    <div className="rounded-2xl border border-violet-800/30 bg-gradient-to-br from-violet-950/30 to-[#1a1b1d] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-violet-800/20">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <span className="text-sm font-medium text-gray-200">AI Metrics Analysis</span>
                                {analysis && (
                                    <span className="text-[10px] text-violet-400 bg-violet-900/40 px-2 py-0.5 rounded-full">Powered by Narrativee</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {analysis && !analysisLoading && (
                                    <button
                                        onClick={runAnalysis}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-violet-400 hover:text-violet-300 text-xs transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Re-analyse
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowAnalysis(false)}
                                    className="text-gray-600 hover:text-gray-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {analysisLoading && (
                            <div className="px-5 py-8 flex flex-col items-center gap-3 text-gray-500">
                                <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
                                <p className="text-sm">Analysing your Substack metrics…</p>
                            </div>
                        )}

                        {analysisError && !analysisLoading && (
                            <div className="px-5 py-4 flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {analysisError}
                            </div>
                        )}

                        {analysis && !analysisLoading && (
                            <div className="px-5 py-5 flex flex-col gap-5">
                                <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-violet-500 pl-3">
                                    {analysis.assessment}
                                </p>
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
                    </div>
                )}

                {/* KPI row */}
                <StatsOverview />

                {/* Growth */}
                <Card title="Subscriber Growth" subtitle="Total and paid subscribers over time">
                    <SubsChart />
                </Card>

                {/* Engagement — full width */}
                <Card title="Engagement Over Time" subtitle="Weekly likes, comments and restacks">
                    <PerformanceChart />
                </Card>

                {/* Heatmap — full width */}
                <Card title="Posting Activity" subtitle="Your publishing frequency over the last 6 months">
                    <PostingHeatmap />
                </Card>

                {/* Best Time to Post + Publication Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card title="Best Time to Post" subtitle="When your audience engages most">
                        <ActivityChart />
                    </Card>
                    <Card title="Publication Overview" subtitle="Live stats synced via extension">
                        <PublishSummaryCard />
                    </Card>
                </div>

            </div>
        </div>
    );
}

export default function Workspace() {
    return (
        <AnalyticsProvider>
            <AnalyticsDashboard />
        </AnalyticsProvider>
    );
}
