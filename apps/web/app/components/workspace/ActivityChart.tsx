"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useAnalytics } from "./AnalyticsProvider";

export function ActivityChart() {
    const { hourlyActivity, loading } = useAnalytics();

    // Show only even-hour labels to avoid crowding
    const tickFormatter = (val: string) => {
        const h = parseInt(val);
        return h % 4 === 0 ? val : "";
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/60" /> Total engagement by hour posted
            </div>

            {loading ? (
                <div className="h-40 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={hourlyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                            formatter={(val: any, name: any) => [val?.toLocaleString() || val, name === "engagement" ? "Engagement" : "Notes"]}
                        />
                        <Area type="monotone" dataKey="engagement" name="engagement" stroke="#10b981" strokeWidth={2} fill="url(#gradActivity)" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
