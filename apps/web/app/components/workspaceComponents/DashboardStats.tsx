import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Users, Zap, Flame, DollarSign, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { CumulativeRevenueChart } from "./CumulativeRevenueChart";

export default function DashboardStats() {
    const { data: session } = authClient.useSession();

    const [stats, setStats] = useState({
        hotLeads: 0,
        activeUsers: 0,
        trialUsers: 0,
        freeUsers: 0,
        paidUsers: 0,
        workflowsTriggered: 0,
        conversions: 0,
        conversionRate: 0,
        revenueAttributed: 0,
        popupsClicked: 0,
        clickThroughRate: 0,
        // Trends (percentage change)
        hotLeadsTrend: 0,
        activeUsersTrend: 0,
        conversionsTrend: 0,
        revenueTrend: 0,
        chartData: [] // For the area chart
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user?.id) return;

        async function fetchStats() {

            try {
                const res = await fetch(`${API_URL}/saas-users/stats`, {
                    headers: {
                        'x-user-id': session?.user?.id || ''
                    }
                });
                const data = await res.json() as any
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [session]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(value);
    };

    console.log(stats);
    const cards = [
        {
            title: "Conversions This Month",
            value: stats.conversions,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            desc: `${stats.conversionRate}% conversion rate`,
            trend: stats.conversionsTrend,
            highlight: true
        },
        {
            title: "Additional Revenue made with Narrativee",
            value: formatCurrency(stats.revenueAttributed),
            color: "text-green-600",
            bg: "bg-green-50",
            desc: "Directly attributed",
            trend: stats.revenueTrend,
            highlight: true
        },
        {
            title: "Hot Leads",
            value: stats.hotLeads,
            icon: Flame,
            color: "text-orange-600",
            bg: "bg-orange-50",
            desc: "High engagement score",
            trend: stats.hotLeadsTrend
        },
        {
            title: "Workflows Fired",
            value: stats.workflowsTriggered,
            icon: Zap,
            color: "text-purple-600",
            bg: "bg-purple-50",
            desc: "Automations triggered",
            trend: null
        },
        {
            title: "Popup Click-Through",
            value: `${stats.clickThroughRate || 0}%`,
            icon: TrendingUp,
            color: "text-teal-600",
            bg: "bg-teal-50",
            desc: `${stats.popupsClicked || 0} clicks / ${stats.workflowsTriggered || 0} triggered`,
            trend: null,
            highlight: stats.clickThroughRate > 0
        },
        {
            title: "Active Users Now",
            value: stats.activeUsers,
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-50",
            desc: "Last 15 minutes",
            trend: stats.activeUsersTrend
        },
        {
            title: "User Distribution",
            value: `${stats.trialUsers + stats.freeUsers}`,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            desc: `Trial: ${stats.trialUsers} • Free: ${stats.freeUsers} • Paid: ${stats.paidUsers}`,
            trend: null,
            isSegmented: true
        }
    ];

    const TrendIndicator = ({ trend } : { trend: number }) => {
        if (trend === null || trend === undefined || trend === 0) return null;

        const isPositive = trend > 0;
        const Icon = isPositive ? TrendingUp : TrendingDown;

        return (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                <Icon size={14} />
                <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6 mb-8">
                {/* Top row - Conversion metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse"></div>
                    ))}
                </div>

                {/* Bottom grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-gray-50 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    const highlightCards = cards.filter(c => c.highlight);
    const regularCards = cards.filter(c => !c.highlight);

    return (
        <div className="space-y-6 mb-8 font-manrope">
            {/* Top Row - Highlight Conversion Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                {highlightCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={i}
                            className="bg-white p-6 rounded-xl transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`${card.color}`}>
                                </div>
                                <TrendIndicator trend={card.trend || 0} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-600 tracking-wide">
                                    {card.title}
                                </p>
                                <h3 className="text-3xl text-gray-900 mt-2 font-geist-mono">
                                    {card.value}
                                </h3>
                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                                    {card.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cumulative Revenue Chart */}
            <div className="grid grid-cols-1">
                <CumulativeRevenueChart
                    data={stats.chartData}
                    totalRevenue={stats.revenueAttributed}
                    trend={stats.revenueTrend}
                />
            </div>

            {/* Bottom Grid - Regular Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {regularCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={i}
                            className="bg-white p-5 rounded-xl transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">

                                <TrendIndicator trend={card.trend || 0} />
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    {card.title}
                                </p>
                                <h3 className="text-2xl font-medium text-gray-900 mt-1 font-geist-mono">
                                    {card.value}
                                </h3>
                                <p className={`text-xs mt-2 ${card.isSegmented ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                                    {card.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Conversion Breakdown - Optional detailed view */}
            {stats.conversions > 0 && (
                <div className="bg-white p-6 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                        Conversion Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-600">Trial → Paid</p>
                                <p className="text-xl font-medium text-gray-900 font-geist-mono">
                                    {Math.floor(stats.conversions * 0.78)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-blue-600">78%</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-600">Free → Paid</p>
                                <p className="text-xl font-medium text-gray-900 font-geist-mono">
                                    {Math.floor(stats.conversions * 0.22)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-purple-600">22%</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-600">Avg. Revenue/Conv.</p>
                                <p className="text-xl font-medium text-gray-900 font-geist-mono">
                                    {stats.conversions > 0
                                        ? formatCurrency(stats.revenueAttributed / stats.conversions)
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">LTV</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}