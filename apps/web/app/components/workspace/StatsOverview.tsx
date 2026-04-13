"use client";

import { MessageSquare, ThumbsUp, Calendar, Activity, Info } from "lucide-react";
import { useAnalytics } from "./AnalyticsProvider";

export function StatsOverview() {
    const { postStats, feedNotes, feedLikes, feedComments, feedRestacks, loading } = useAnalytics();

    // Use reader feed data as primary source for notes engagement
    const totalLikes = feedLikes + (postStats?.totalLikes || 0);
    const totalComments = feedComments + (postStats?.totalComments || 0);
    const totalRestacks = feedRestacks;
    const engagementScore = totalLikes * 1 + totalComments * 3 + totalRestacks * 5;

    // Best posting day from feed notes
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let bestDay = "N/A";
    const dayStats: Record<number, { engagement: number; count: number }> = {};
    for (const n of feedNotes) {
        const eng = n.likes * 1 + n.comments * 3 + n.restacks * 5;
        if (!dayStats[n.dayOfWeek]) dayStats[n.dayOfWeek] = { engagement: 0, count: 0 };
        dayStats[n.dayOfWeek]!.engagement += eng;
        dayStats[n.dayOfWeek]!.count += 1;
    }
    let maxAvg = -1;
    for (const [dayStr, data] of Object.entries(dayStats)) {
        if (data.count > 0) {
            const avg = data.engagement / data.count;
            if (avg > maxAvg) { maxAvg = avg; bestDay = days[parseInt(dayStr)]!; }
        }
    }

    const statItems = [
        {
            label: "Total Likes",
            value: totalLikes.toLocaleString(),
            icon: ThumbsUp,
            color: "text-purple-400",
            bg: "bg-purple-900/20",
            tooltip: "Combined likes from all your Notes and Newsletter Posts"
        },
        {
            label: "Total Comments",
            value: totalComments.toLocaleString(),
            icon: MessageSquare,
            color: "text-orange-400",
            bg: "bg-orange-900/20",
            tooltip: "Combined comments from all your Notes and Newsletter Posts"
        },
        {
            label: "Engagement Score",
            value: engagementScore.toLocaleString(),
            icon: Activity,
            color: "text-green-400",
            bg: "bg-green-900/20",
            tooltip: "Weighted score: 1× Like + 3× Comment + 5× Restack"
        },
        {
            label: "Best Posting Day",
            value: bestDay,
            icon: Calendar,
            color: "text-pink-400",
            bg: "bg-pink-900/20",
            tooltip: "The day your content gets the highest average engagement"
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse h-28 bg-[#1a1b1d] rounded-2xl border border-white/[0.06] w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((stat, index) => (
                <div
                    key={index}
                    className="p-4 bg-[#1a1b1d] rounded-2xl border border-white/[0.06] flex flex-col gap-3 transition-all hover:border-white/[0.12]"
                >
                    <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        {stat.tooltip && (
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-600 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-xs text-gray-200 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                                    {stat.tooltip}
                                    <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-gray-800" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-100 truncate">{stat.value}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
