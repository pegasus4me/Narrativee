"use client";

import { useEffect, useState } from "react";
import { narrativee } from "@narrativee/sdk";
import { NarrativeeTrigger } from "@narrativee/sdk/react";
import { authClient } from "@/lib/auth-client";
import {
    X, Sparkles, BarChart3, Users, DollarSign, Download, FileText, Plug, Zap,
    TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Clock, CheckCircle2,
    AlertCircle, ChevronRight, Bell, Search, Settings, HelpCircle
} from "lucide-react";

// Upgrade Popup Component (triggered by Narrativee)
const UpgradePopup = () => {
    const [open, setOpen] = useState(true);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-purple-500/25">
                        <Sparkles size={28} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">You're a Power User! 🚀</h2>
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                            You've been exploring advanced features. Upgrade to Pro for unlimited access.
                        </p>
                    </div>

                    <div className="w-full pt-2 space-y-2">
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors text-sm"
                        >
                            Upgrade to Pro — $29/mo
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock data
const recentTransactions = [
    { id: 1, customer: "Sarah Johnson", email: "sarah@company.com", amount: 299, status: "success", time: "2 min ago" },
    { id: 2, customer: "Mike Chen", email: "mike@startup.io", amount: 99, status: "success", time: "15 min ago" },
    { id: 3, customer: "Emma Davis", email: "emma@agency.co", amount: 199, status: "pending", time: "1 hour ago" },
    { id: 4, customer: "Alex Turner", email: "alex@tech.dev", amount: 499, status: "success", time: "3 hours ago" },
];

const recentActivity = [
    { action: "New signup", detail: "john@example.com joined", time: "Just now" },
    { action: "Upgrade", detail: "Pro plan activated", time: "5 min ago" },
    { action: "Export", detail: "Q4 report downloaded", time: "12 min ago" },
    { action: "Integration", detail: "Slack connected", time: "1 hour ago" },
];

export default function AcmeAnalyticsDemo() {
    const { data: session } = authClient.useSession();
    const [eventLog, setEventLog] = useState<string[]>([]);

    const logEvent = (eventName: string) => {
        setEventLog(prev => [`${new Date().toLocaleTimeString()} — ${eventName}`, ...prev.slice(0, 4)]);
    };

    useEffect(() => {
        narrativee.init("nr-live-a969db13-6a4e-42c4-825e-9101a32dffe8");

        if (session?.user?.id) {
            narrativee.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
                plan: "free"
            });
        }

        narrativee.event("view_dashboard", { source: "demo" });
        logEvent("view_dashboard");
    }, [session]);

    const handleFeatureClick = async (feature: string) => {
        await narrativee.event("used_feature", { feature });
        logEvent(`used_feature: ${feature}`);
    };

    const handlePricingClick = async () => {
        await narrativee.event("view_pricing", { source: "demo-cta" });
        logEvent("view_pricing");
    };

    return (
        <div className="min-h-screen bg-[#f6f8fa] font-sans antialiased">
            <NarrativeeTrigger id="vip-modal" component={<UpgradePopup />} />

            {/* Top Navigation - Stripe Style */}
            <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <BarChart3 size={15} className="text-white" />
                                </div>
                                <span className="font-semibold text-[15px] text-gray-900">Acme</span>
                            </div>
                            <nav className="flex items-center gap-1 text-[13px]">
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-md font-medium">Home</span>
                                <span className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">Payments</span>
                                <span className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">Customers</span>
                                <span className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">Products</span>
                                <span onClick={() => handleFeatureClick("reports")} className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">Reports</span>
                            </nav>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-gray-500 text-[13px] w-48">
                                <Search size={14} />
                                <span>Search...</span>
                            </div>
                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                <Bell size={18} />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                <Settings size={18} />
                            </button>
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white text-[11px] font-semibold ml-1">
                                JD
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Track your business metrics and performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleFeatureClick("export")}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <button
                            onClick={handlePricingClick}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors"
                        >
                            Upgrade
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] text-gray-500 font-medium">Total Revenue</span>
                            <div className="flex items-center text-emerald-600 text-[12px] font-medium">
                                <ArrowUpRight size={14} className="mr-0.5" />
                                12.5%
                            </div>
                        </div>
                        <div className="text-[28px] font-semibold text-gray-900 tracking-tight">$48,295</div>
                        <div className="text-[12px] text-gray-400 mt-1">vs $42,890 last month</div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] text-gray-500 font-medium">Active Users</span>
                            <div className="flex items-center text-emerald-600 text-[12px] font-medium">
                                <ArrowUpRight size={14} className="mr-0.5" />
                                8.2%
                            </div>
                        </div>
                        <div className="text-[28px] font-semibold text-gray-900 tracking-tight">12,847</div>
                        <div className="text-[12px] text-gray-400 mt-1">892 new this week</div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] text-gray-500 font-medium">Conversion Rate</span>
                            <div className="flex items-center text-emerald-600 text-[12px] font-medium">
                                <ArrowUpRight size={14} className="mr-0.5" />
                                0.4%
                            </div>
                        </div>
                        <div className="text-[28px] font-semibold text-gray-900 tracking-tight">3.2%</div>
                        <div className="text-[12px] text-gray-400 mt-1">Target: 4.0%</div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] text-gray-500 font-medium">Avg. Order Value</span>
                            <div className="flex items-center text-red-500 text-[12px] font-medium">
                                <ArrowDownRight size={14} className="mr-0.5" />
                                2.1%
                            </div>
                        </div>
                        <div className="text-[28px] font-semibold text-gray-900 tracking-tight">$156</div>
                        <div className="text-[12px] text-gray-400 mt-1">vs $159 last month</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Transactions Table */}
                    <div className="col-span-2 bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 text-[15px]">Recent Transactions</h3>
                            <button
                                onClick={() => handleFeatureClick("view_all_transactions")}
                                className="text-[13px] text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                View all
                            </button>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-[12px] text-gray-500 border-b border-gray-100">
                                    <th className="px-5 py-3 font-medium">Customer</th>
                                    <th className="px-5 py-3 font-medium">Amount</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-medium text-gray-900 text-[13px]">{tx.customer}</div>
                                            <div className="text-gray-400 text-[12px]">{tx.email}</div>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-gray-900 text-[13px]">${tx.amount}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tx.status === 'success'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {tx.status === 'success' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                {tx.status === 'success' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-400 text-[12px]">{tx.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Activity Feed */}
                        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900 text-[15px]">Activity</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {recentActivity.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            {item.action === 'New signup' && <Users size={14} className="text-gray-600" />}
                                            {item.action === 'Upgrade' && <Zap size={14} className="text-violet-600" />}
                                            {item.action === 'Export' && <Download size={14} className="text-blue-600" />}
                                            {item.action === 'Integration' && <Plug size={14} className="text-teal-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-gray-900">{item.action}</div>
                                            <div className="text-[12px] text-gray-400">{item.detail}</div>
                                        </div>
                                        <span className="text-[11px] text-gray-400 flex-shrink-0">{item.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4">
                            <h3 className="font-semibold text-gray-900 text-[15px] mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleFeatureClick("create_invoice")}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <FileText size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-medium text-gray-900">Create Invoice</div>
                                        <div className="text-[11px] text-gray-400">Generate a new invoice</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleFeatureClick("add_customer")}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                                        <Users size={16} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-medium text-gray-900">Add Customer</div>
                                        <div className="text-[11px] text-gray-400">Create a new customer</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleFeatureClick("integrations")}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
                                        <Plug size={16} className="text-violet-600" />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-medium text-gray-900">Integrations</div>
                                        <div className="text-[11px] text-gray-400">Connect your tools</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upgrade Banner */}
                <div
                    onClick={handlePricingClick}
                    className="mt-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Sparkles size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg">Unlock Pro Features</h3>
                            <p className="text-gray-400 text-sm">Unlimited exports, advanced analytics, and priority support.</p>
                        </div>
                    </div>
                    <button className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg text-sm transition-colors group-hover:scale-105">
                        Upgrade Now →
                    </button>
                </div>

                {/* Event Log (for demo) */}
                <div className="mt-8 bg-gray-900 rounded-xl p-4 font-mono text-xs">
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[11px] uppercase tracking-wider">Narrativee Event Log</span>
                    </div>
                    <div className="space-y-1">
                        {eventLog.length === 0 ? (
                            <p className="text-gray-600">Waiting for events...</p>
                        ) : (
                            eventLog.map((log, i) => (
                                <p key={i} className={i === 0 ? "text-emerald-400" : "text-gray-500"}>{log}</p>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
