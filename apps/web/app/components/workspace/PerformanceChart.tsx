"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { API_URL } from "@/lib/api-config";
import { format, parseISO } from "date-fns";

interface PerfPoint {
    week: string;
    likes: number;
    comments: number;
    restacks: number;
    noteCount: number;
}

// Custom Tooltip Component
interface TooltipEntry { dataKey: string; value: number; }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
    if (!active || !payload || payload.length === 0) return null;

    const likes = payload.find(p => p.dataKey === "likes")?.value || 0;
    const comments = payload.find(p => p.dataKey === "comments")?.value || 0;
    const restacks = payload.find(p => p.dataKey === "restacks")?.value || 0;

    const totalEngagement = (likes as number) * 1 + (comments as number) * 3 + (restacks as number) * 5;

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
                    <span className="text-emerald-400 font-bold text-xs">{totalEngagement}</span>
                </div>
            </div>
        </div>
    );
};

export function PerformanceChart() {
    const [data, setData] = useState<PerfPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/notes/performance-over-time`, { credentials: "include" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json: any) => setData(json.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const chartData = data.map(d => ({
        ...d,
        label: d.week ? format(parseISO(d.week), "MMM d") : "",
    }));

    // Calculate summary statistics
    const totalLikes = data.reduce((sum, d) => sum + d.likes, 0);
    const totalComments = data.reduce((sum, d) => sum + d.comments, 0);
    const totalRestacks = data.reduce((sum, d) => sum + d.restacks, 0);
    const totalEngagement = totalLikes * 1 + totalComments * 3 + totalRestacks * 5;

    return (
        <div className="bg-[#1e1f21] rounded-lg overflow-hidden">
            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2">
                    <div className="text-gray-500 text-sm">No performance data available</div>
                    <div className="text-gray-600 text-xs">Sync your notes to see performance trends</div>
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
                            <span className="text-gray-600">Engagement:</span>
                            <span className="font-semibold text-emerald-400">{totalEngagement}</span>
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
                            <Tooltip content={<CustomTooltip />} />
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
