"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Users } from "lucide-react";
import { useAnalytics } from "./AnalyticsProvider";
import { format, parseISO } from "date-fns";

export function SubsChart() {
    const { subsTimeseries, paidSubsTimeseries, loading } = useAnalytics();

    // Build a map from date → { total, paid } by merging both timeseries
    const dateMap = new Map<string, { total?: number; paid?: number }>();

    for (const [date, count] of subsTimeseries) {
        const key = date.replace(/\//g, "-");
        dateMap.set(key, { ...dateMap.get(key), total: count });
    }

    // paidSubsTimeseries rows: [date, paid, trials, totalOrNull]
    for (const [date, paid] of paidSubsTimeseries) {
        const key = (date as string).replace(/\//g, "-");
        dateMap.set(key, { ...dateMap.get(key), paid });
    }

    const raw = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({ date, total: vals.total ?? null, paid: vals.paid ?? null }));

    // Sample to ~30 points max so labels don't crowd
    const step = raw.length > 30 ? Math.ceil(raw.length / 30) : 1;
    const chartData = raw
        .filter((_, i) => i % step === 0 || i === raw.length - 1)
        .map(d => ({
            ...d,
            label: (() => {
                try { return format(parseISO(d.date), "MMM d"); } catch { return d.date; }
            })(),
        }));

    const lastTotal = [...raw].reverse().find(d => d.total !== null)?.total ?? 0;
    const firstTotal = raw.find(d => d.total !== null)?.total ?? 0;
    const totalDelta = lastTotal - firstTotal;

    const lastPaid = [...raw].reverse().find(d => d.paid !== null)?.paid ?? 0;

    const hasTotalData = raw.some(d => d.total !== null);
    const hasPaidData = raw.some(d => d.paid !== null);

    return (
        <div>
            {/* Summary row */}
            {(hasTotalData || hasPaidData) && (
                <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-500">
                    {hasTotalData && (
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-500/70" />
                            <span className="font-semibold text-violet-400">{lastTotal.toLocaleString()}</span> total subscribers
                            {totalDelta > 0 && (
                                <span className="text-emerald-400 ml-1">
                                    +{totalDelta.toLocaleString()} since {(() => { try { return format(parseISO(raw[0]!.date), "MMM d"); } catch { return raw[0]!.date; } })()}
                                </span>
                            )}
                        </span>
                    )}
                    {hasPaidData && (
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400/70" />
                            <span className="font-semibold text-amber-400">{lastPaid.toLocaleString()}</span> paid
                        </span>
                    )}
                </div>
            )}

            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-gray-600">
                    <Users className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No subscriber data yet.</p>
                    <p className="text-xs text-gray-700">Reload with the extension installed and logged into Substack.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                            <linearGradient id="gradSubs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2d" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: "#6b7280", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "#6b7280", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ background: "#1a1b1d", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: "#d1d5db" }}
                            formatter={(val: unknown, name?: string) => [
                                val !== null && val !== undefined ? Number(val).toLocaleString() : "—",
                                name === "total" ? "Total subscribers" : "Paid subscribers",
                            ]}
                        />
                        {hasTotalData && (
                            <Line
                                type="monotone"
                                dataKey="total"
                                name="total"
                                stroke="#8b5cf6"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#1a1b1d", strokeWidth: 2 }}
                                connectNulls
                            />
                        )}
                        {hasPaidData && (
                            <Line
                                type="monotone"
                                dataKey="paid"
                                name="paid"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="4 2"
                                activeDot={{ r: 4, fill: "#f59e0b", stroke: "#1a1b1d", strokeWidth: 2 }}
                                connectNulls
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
