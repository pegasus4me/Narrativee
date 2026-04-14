"use client";

import { useAnalytics } from "./AnalyticsProvider";

interface StatRowProps {
    label: string;
    value: number | string;
    delta?: number | null;
    deltaLabel?: string;
    suffix?: string;
}

function StatRow({ label, value, delta, deltaLabel, suffix }: StatRowProps) {
    const isPositive = delta !== undefined && delta !== null && delta > 0;
    const isNegative = delta !== undefined && delta !== null && delta < 0;

    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-800/60 last:border-0">
            <span className="text-sm text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-100">
                    {value}{suffix}
                </span>
                {delta !== undefined && delta !== null && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                        isPositive ? "text-emerald-400 bg-emerald-400/10" :
                        isNegative ? "text-red-400 bg-red-400/10" :
                        "text-gray-500 bg-gray-700/40"
                    }`}>
                        {isPositive ? "+" : ""}{deltaLabel ?? delta}
                    </span>
                )}
            </div>
        </div>
    );
}

export function PublishSummaryCard() {
    const { publishSummary, loading } = useAnalytics();

    if (loading) {
        return (
            <div className="h-24 flex items-center justify-center text-gray-600 text-sm animate-pulse">
                Loading...
            </div>
        );
    }

    if (!publishSummary) {
        return (
            <div className="h-24 flex flex-col items-center justify-center gap-1.5">
                <div className="text-gray-500 text-xs text-center px-2">
                    Requires the Narrativee extension + Substack login to sync
                </div>
            </div>
        );
    }

    const viewsDeltaLabel = publishSummary.viewsDelta > 0
        ? `+${publishSummary.viewsDelta}`
        : `${publishSummary.viewsDelta}`;

    const openRateDeltaLabel = publishSummary.openRateDiff > 0
        ? `+${publishSummary.openRateDiff.toFixed(1)}%`
        : `${publishSummary.openRateDiff.toFixed(1)}%`;

    return (
        <div className="flex flex-col">
            <StatRow
                label="App subscribers"
                value={publishSummary.appSubscribers}
                delta={publishSummary.appSubscribersLast30Days}
                deltaLabel={`+${publishSummary.appSubscribersLast30Days} this month`}
            />
            <StatRow
                label="Email subscribers"
                value={publishSummary.totalEmail}
                delta={publishSummary.totalEmailLast30Days}
                deltaLabel={`+${publishSummary.totalEmailLast30Days} this month`}
            />
            <StatRow
                label="Views"
                value={publishSummary.views}
                delta={publishSummary.viewsDelta}
                deltaLabel={viewsDeltaLabel}
            />
            <StatRow
                label="Open rate"
                value={`${publishSummary.openRate}%`}
                delta={publishSummary.openRateDiff}
                deltaLabel={openRateDeltaLabel}
            />
        </div>
    );
}
