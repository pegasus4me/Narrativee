"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { API_URL } from "@/lib/api-config";

interface HourlyPoint {
    hour: number;
    label: string;
    engagement: number;
    noteCount: number;
}

export function ActivityChart() {
    const [data, setData] = useState<HourlyPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/notes/hourly-activity`, { credentials: "include" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(json => setData(json.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Show only even-hour labels to avoid crowding
    const tickFormatter = (val: string) => {
        const h = parseInt(val);
        return h % 4 === 0 ? val : "";
    };

    return (
        <div className="bg-[#1e1f21] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/60" /> Total engagement by hour posted
            </div>

            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2d" />
                        <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ background: "#1e1f21", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: "#d1d5db" }}
                            formatter={(val: number, name: string) => [val.toLocaleString(), name === "engagement" ? "Engagement" : "Notes"]}
                        />
                        <Area type="monotone" dataKey="engagement" name="engagement" stroke="#10b981" strokeWidth={2} fill="url(#gradActivity)" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
