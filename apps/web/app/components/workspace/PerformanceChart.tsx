"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO, startOfWeek } from "date-fns";
import { useAnalytics } from "./AnalyticsProvider";

// Custom Tooltip Component
interface TooltipEntry { dataKey: string; value: number; }
const CustomTooltip = ({ active, payload, label, maxEngagement }: { active?: boolean; payload?: TooltipEntry[]; label?: string; maxEngagement: number }) => {
    if (!active || !payload || payload.length === 0) return null;

    const likes = payload.find(p => p.dataKey === "likes")?.value || 0;
    const comments = payload.find(p => p.dataKey === "comments")?.value || 0;
    const restacks = payload.find(p => p.dataKey === "restacks")?.value || 0;
    const rawEngagement = (likes as number) * 1 + (comments as number) * 3 + (restacks as number) * 5;
    const score = maxEngagement > 0 ? Math.round((rawEngagement / maxEngagement) * 100) / 10 : 0;

    return (
        <div className="bg-[#1a1b1d] border border-gray-700 rounded-lg p-3 shadow-xl">
            <p className="text-gray-300 font-medium text-xs mb-2">{label}</p>
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-gray-400">Likes:</span>
                    </span>
                    <span className="text-violet-400 font-semibold text-xs">{likes}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-gray-400">Comments:</span>
                    </span>
                    <span className="text-blue-400 font-semibold text-xs">{comments}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-gray-400">Restacks:</span>
                    </span>
                    <span className="text-amber-400 font-semibold text-xs">{restacks}</span>
                </div>
                <div className="border-t border-gray-700 mt-1 pt-1.5 flex items-center justify-between gap-3">
                    <span className="text-gray-400 text-[10px]">Engagement Score:</span>
                    <span className="text-emerald-400 font-bold text-xs">{score.toFixed(1)} <span className="text-gray-600 font-normal">/ 10</span></span>
                </div>
            </div>
        </div>
    );
};

export function PerformanceChart() {
    const { feedNotes, feedLikes, feedComments, feedRestacks, loading } = useAnalytics();

    // Group feed notes by week, summing engagement per week
    const weekMap = new Map<string, { likes: number; comments: number; restacks: number; noteCount: number }>();
    for (const n of feedNotes) {
        const weekStart = format(startOfWeek(parseISO(n.date)), "yyyy-MM-dd");
        const existing = weekMap.get(weekStart) ?? { likes: 0, comments: 0, restacks: 0, noteCount: 0 };
        weekMap.set(weekStart, {
            likes: existing.likes + n.likes,
            comments: existing.comments + n.comments,
            restacks: existing.restacks + n.restacks,
            noteCount: existing.noteCount + 1,
        });
    }

    const chartData = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, d]) => ({
            week,
            label: format(parseISO(week), "MMM d"),
            likes: d.likes,
            comments: d.comments,
            restacks: d.restacks,
            noteCount: d.noteCount,
        }));

    const totalLikes = feedLikes;
    const totalComments = feedComments;
    const totalRestacks = feedRestacks;

    // Max raw engagement across all weeks — used to normalize score to /10
    const maxEngagement = Math.max(
        ...chartData.map(d => d.likes * 1 + d.comments * 3 + d.restacks * 5),
        1
    );

    const totalRawEngagement = totalLikes * 1 + totalComments * 3 + totalRestacks * 5;
    const overallScore = maxEngagement > 0
        ? Math.round((totalRawEngagement / (maxEngagement * chartData.length)) * 100) / 10
        : 0;

    return (
        <div>
            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2">
                    <div className="text-gray-500 text-sm">No engagement data yet</div>
                    <div className="text-gray-600 text-xs">Post notes on Substack to see your trends</div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* Summary Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-500/70" />
                            <span className="font-semibold text-violet-400">{totalLikes}</span> likes
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500/60" />
                            <span className="font-semibold text-blue-400">{totalComments}</span> comments
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/60" />
                            <span className="font-semibold text-amber-400">{totalRestacks}</span> restacks
                        </span>
                        <span className="flex items-center gap-1.5 ml-auto">
                            <span className="text-gray-600">Score:</span>
                            <span className="font-semibold text-emerald-400">{overallScore.toFixed(1)}<span className="text-gray-600 font-normal text-[10px]"> / 10</span></span>
                        </span>
                    </div>

                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradLikes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradComments" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradRestacks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2d" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "#9ca3af", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#9ca3af", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip maxEngagement={maxEngagement} />} />
                            <Area
                                type="monotone"
                                dataKey="likes"
                                name="Likes"
                                stroke="#8b5cf6"
                                strokeWidth={2.5}
                                fill="url(#gradLikes)"
                                activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#1e1f21", strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="comments"
                                name="Comments"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                fill="url(#gradComments)"
                                activeDot={{ r: 5, fill: "#3b82f6", stroke: "#1e1f21", strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="restacks"
                                name="Restacks"
                                stroke="#f59e0b"
                                strokeWidth={2.5}
                                fill="url(#gradRestacks)"
                                activeDot={{ r: 5, fill: "#f59e0b", stroke: "#1e1f21", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
