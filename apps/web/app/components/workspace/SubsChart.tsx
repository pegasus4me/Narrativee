"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";

interface SubsPoint {
    month: string;
    freeCount: number;
    paidCount: number;
    totalCount: number;
}

export function SubsChart() {
    const [data, setData] = useState<SubsPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [onboardingData, setOnboardingData] = useState<any>({});
    const { data: session } = authClient.useSession();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/subscribers`, { credentials: "include" });
            const json = await res.json();
            setData(json.data || []);
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

    // Listen for subs scraped from extension
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === "NARRATIVEE_SUBS_SCRAPED") {
                if (event.data.error) {
                    toast.error(`Subs sync failed: ${event.data.error}`);
                    setSyncing(false);
                    return;
                }
                const scraped = event.data.data || [];
                if (scraped.length === 0) {
                    toast.info("No subscriber data found on the page.");
                    setSyncing(false);
                    return;
                }
                try {
                    await fetch(`${API_URL}/subscribers/sync-extension`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ data: scraped }),
                    });
                    toast.success("Subscriber data synced!");
                    await fetchData();
                } catch (e) {
                    toast.error("Failed to save subscriber data");
                } finally {
                    setSyncing(false);
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleSync = () => {
        const pubUrl = onboardingData?.substackPublicationUrl || onboardingData?.substackProfileUrl;
        if (!pubUrl) {
            toast.error("No Substack publication URL found. Please complete onboarding first.");
            return;
        }
        setSyncing(true);
        window.postMessage({ type: "NARRATIVEE_START_SUBS_SYNC", publicationUrl: pubUrl }, "*");
        setTimeout(() => setSyncing(false), 60000);
    };

    const chartData = [...data]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(d => ({
            ...d,
            label: d.month
                ? new Date(d.month + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : d.month,
        }));

    return (
        <div className="bg-[#1e1f21] rounded-lg overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="inline-block w-3 h-3 rounded-sm bg-violet-500/70" /> Paid
                    <span className="inline-block w-3 h-3 rounded-sm bg-blue-500/50 ml-2" /> Free
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-violet-900/20 text-violet-400 rounded-lg hover:bg-violet-900/40 transition-colors disabled:opacity-50 text-xs font-medium border border-violet-800/50"
                >
                    <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync Subs"}
                </button>
            </div>

            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm animate-pulse">Loading...</div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-gray-600">
                    <Users className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No subscriber data yet.</p>
                    <p className="text-xs text-gray-700">Click &quot;Sync Subs&quot; to import from Substack.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradFree" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b2d" />
                        <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ background: "#1e1f21", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: "#d1d5db" }}
                        />
                        <Area type="monotone" dataKey="freeCount" name="Free" stroke="#3b82f6" strokeWidth={2} fill="url(#gradFree)" />
                        <Area type="monotone" dataKey="paidCount" name="Paid" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradPaid)" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
