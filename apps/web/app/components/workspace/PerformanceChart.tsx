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

export function PerformanceChart() {
    const [data, setData] = useState<PerfPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/notes/performance-over-time`, { credentials: "include" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(json => setData(json.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const chartData = data.map(d => ({
        ...d,
        label: d.week ? format(parseISO(d.week), "MMM d") : "",
    }));

    return (
        <div className="bg-[#1e1f21] rounded-lg overflow-hidden">
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-violet-500/70" /> Likes
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-blue-500/60" /> Comments
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-amber-500/60" /> Restacks
                </span>
            </div>

            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                    No data yet — sync your notes first.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradLikes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradComments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradRestacks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2d" />
                        <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ background: "#1e1f21", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: "#d1d5db" }}
                        />
                        <Area type="monotone" dataKey="likes" name="Likes" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradLikes)" />
                        <Area type="monotone" dataKey="comments" name="Comments" stroke="#3b82f6" strokeWidth={2} fill="url(#gradComments)" />
                        <Area type="monotone" dataKey="restacks" name="Restacks" stroke="#f59e0b" strokeWidth={2} fill="url(#gradRestacks)" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
