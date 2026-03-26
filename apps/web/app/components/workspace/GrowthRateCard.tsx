"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface GrowthData {
    currentMonth: number;
    previousMonth: number;
    delta: number;
    percentChange: number | null;
    currentMonthLabel: string;
    previousMonthLabel: string;
}

export function GrowthRateCard() {
    const [data, setData] = useState<GrowthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/subscribers`, { credentials: "include" })
            .then(r => r.json())
            .then((json: any) => {
                const rows: { month: string; totalCount: number }[] = (json.data || [])
                    .sort((a: any, b: any) => b.month.localeCompare(a.month));

                if (rows.length === 0) { setLoading(false); return; }

                const current = rows[0]!;
                const previous = rows[1] ?? null;

                const currentTotal = current.totalCount;
                const previousTotal = previous?.totalCount ?? 0;
                const delta = currentTotal - previousTotal;
                const percentChange = previousTotal > 0
                    ? Math.round((delta / previousTotal) * 100)
                    : null;

                const formatMonth = (m: string) => {
                    const [year, month] = m.split("-");
                    return new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });
                };

                setData({
                    currentMonth: currentTotal,
                    previousMonth: previousTotal,
                    delta,
                    percentChange,
                    currentMonthLabel: formatMonth(current.month),
                    previousMonthLabel: previous ? formatMonth(previous.month) : "",
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="animate-pulse h-24 bg-[#1a1b1d] rounded-2xl border border-white/[0.06] w-full" />;
    }

    if (!data) return null;

    const isPositive = data.delta > 0;
    const isNeutral = data.delta === 0;

    const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
    const trendColor = isNeutral ? "text-gray-400" : isPositive ? "text-emerald-400" : "text-red-400";
    const trendBg = isNeutral ? "bg-gray-800/40" : isPositive ? "bg-emerald-900/20" : "bg-red-900/20";
    const deltaLabel = isPositive ? `+${data.delta}` : `${data.delta}`;

    return (
        <div className="p-5 bg-[#1a1b1d] rounded-2xl border border-white/[0.06] flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-900/20">
                    <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${trendBg}`}>
                    <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                    <span className={`text-xs font-semibold ${trendColor}`}>
                        {data.percentChange !== null ? `${isPositive ? "+" : ""}${data.percentChange}%` : "—"}
                    </span>
                </div>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-100">{data.currentMonth.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Subscribers · {data.currentMonthLabel}</p>
            </div>
            <p className="text-xs text-gray-600">
                {deltaLabel} vs {data.previousMonthLabel || "last month"}
            </p>
        </div>
    );
}
