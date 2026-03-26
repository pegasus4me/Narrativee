"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Users, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface SubsPoint {
    month: string;
    freeCount: number;
    paidCount: number;
    totalCount: number;
    label: string;
}

export function GrowthChart() {
    const [data, setData] = useState<SubsPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [onboardingData, setOnboardingData] = useState<any>({});
    const { data: session } = authClient.useSession();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/subscribers`, { credentials: "include" });
            const json: any = await res.json();
            const sorted = (json.data || []).sort((a: any, b: any) => a.month.localeCompare(b.month));
            setData(sorted.map((d: any) => ({
                ...d,
                label: (() => { const [y, m] = d.month.split("-"); return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }); })(),
            })));
        } catch (e) {
            console.error("Failed to fetch subscribers", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (session?.user) {
            fetch(`${API_URL}/onboarding`, { credentials: "include" })
                .then(r => r.json())
                .then(d => setOnboardingData(d))
                .catch(console.error);
        }
    }, [session?.user]);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === "NARRATIVEE_SUBS_SCRAPED") {
                if (event.data.error) { toast.error(`Sync failed: ${event.data.error}`); setSyncing(false); return; }
                const scraped = event.data.data || [];
                if (scraped.length === 0) { toast.info("No subscriber data found."); setSyncing(false); return; }
                try {
                    await fetch(`${API_URL}/subscribers/sync-extension`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        credentials: "include", body: JSON.stringify({ data: scraped }),
                    });
                    toast.success("Subscribers synced!");
                    await fetchData();
                } catch { toast.error("Failed to save subscriber data"); }
                finally { setSyncing(false); }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleSync = () => {
        const pubUrl = onboardingData?.substackPublicationUrl || onboardingData?.substackProfileUrl;
        if (!pubUrl) { toast.error("No Substack URL found. Complete onboarding first."); return; }
        setSyncing(true);
        window.postMessage({ type: "NARRATIVEE_START_SUBS_SYNC", publicationUrl: pubUrl }, "*");
        setTimeout(() => setSyncing(false), 60000);
    };

    // Growth stats
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const delta = latest && previous ? latest.totalCount - previous.totalCount : null;
    const pct = delta !== null && previous && previous.totalCount > 0
        ? Math.round((delta / previous.totalCount) * 100) : null;
    const isPositive = delta !== null && delta > 0;
    const isNeutral = delta === 0;
    const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
    const trendColor = isNeutral ? "text-gray-400" : isPositive ? "text-emerald-400" : "text-red-400";
    const trendBg = isNeutral ? "bg-gray-800/40" : isPositive ? "bg-emerald-900/30" : "bg-red-900/30";

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-900/20">
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-100">
                            {latest ? latest.totalCount.toLocaleString() : "—"}
                            <span className="text-xs text-gray-500 font-normal ml-1">subscribers</span>
                        </p>
                        {delta !== null && (
                            <div className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${trendBg} ${trendColor}`}>
                                <TrendIcon className="w-2.5 h-2.5" />
                                {pct !== null ? `${isPositive ? "+" : ""}${pct}%` : "—"} vs last month
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40 transition-colors disabled:opacity-50 text-xs font-medium border border-blue-800/30"
                >
                    <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync"}
                </button>
            </div>

            {/* Chart */}
            {loading ? (
                <div className="h-44 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : data.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center gap-2 text-gray-600">
                    <Users className="w-7 h-7 opacity-20" />
                    <p className="text-sm">No subscriber data yet</p>
                    <p className="text-xs text-gray-700">Click Sync to import from Substack</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={176}>
                        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2d" />
                            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#1a1b1d", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#d1d5db" }} />
                            <Area type="monotone" dataKey="totalCount" name="Total" stroke="#3b82f6" strokeWidth={2} fill="url(#gradTotal)" />
                            <Area type="monotone" dataKey="paidCount" name="Paid" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradPaid)" />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500/60" /> Total</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-500/70" /> Paid</span>
                    </div>
                </>
            )}
        </div>
    );
}
