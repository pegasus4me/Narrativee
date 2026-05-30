"use client";

import { useState, useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import { reportApi } from "../../lib/apis";
import { User, CreditCard, Settings2, LogOut, Trash2, Globe } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Tab = "profile" | "billing" | "preferences";

export default function SettingsPage() {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [credits, setCredits] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (session?.user) {
            reportApi.getUserCredits().then(setCredits).catch(console.error);
        }
    }, [session]);


    const handleManageSubscription = async () => {
        setIsLoading(true);
        try {
            const data = await reportApi.createPortalSession();
            if (data.url) window.location.href = data.url;
            else alert("Failed to open billing portal");
        } catch {
            alert("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/");
    };

    if (!session?.user) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Please log in to view settings.
            </div>
        );
    }

    const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: "profile", label: "Profile", icon: User },
        { id: "billing", label: "Billing & Plans", icon: CreditCard },
        { id: "preferences", label: "Preferences", icon: Settings2 },
    ];

    return (
        <div className="max-w-5xl mx-auto px-8 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-100 font-urbanist">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your account, billing, and preferences.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-52 flex-shrink-0">
                    <nav className="flex flex-col gap-1">
                        {NAV.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                                    activeTab === id
                                        ? "bg-white/[0.08] text-gray-100"
                                        : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                            </button>
                        ))}

                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition-colors"
                            >
                                <LogOut className="w-4 h-4 shrink-0" />
                                Sign Out
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-h-[500px]">

                    {/* ── PROFILE ── */}
                    {activeTab === "profile" && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-6">
                                <h2 className="text-base font-semibold text-gray-100 mb-5">Profile Information</h2>
                                <div className="flex items-center gap-4 mb-6">
                                    <Image
                                        src={session.user.image || "/default-avatar.png"}
                                        alt="Profile"
                                        width={64}
                                        height={64}
                                        className="rounded-full border border-white/[0.08] object-cover"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-200">{session.user.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{session.user.email}</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 max-w-md">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue={session.user.name || ""}
                                            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-gray-200 outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            defaultValue={session.user.email || ""}
                                            disabled
                                            className="w-full px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-sm text-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                    <button className="self-start px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors">
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#1a1b1d] rounded-2xl border border-red-900/30 p-6">
                                <h2 className="text-base font-semibold text-red-400 mb-4">Danger Zone</h2>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-200">Delete Account</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all data.</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-800/30 text-red-400 rounded-xl hover:bg-red-900/30 text-sm font-medium transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── BILLING ── */}
                    {activeTab === "billing" && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-6">
                                <h2 className="text-base font-semibold text-gray-100 mb-5">Current Plan</h2>
                                <div className="p-6 bg-[#111113] rounded-xl border border-white/[0.06] relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Current Subscription</p>
                                        <h3 className="text-3xl font-semibold text-gray-100 font-urbanist capitalize mb-4">
                                            {(session.user as any).plan || "Free"} Plan
                                        </h3>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 text-xs font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                Active
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Credits Remaining</p>
                                                <p className="text-2xl font-semibold text-gray-100 font-urbanist">
                                                    {credits !== null ? credits : "—"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleManageSubscription}
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? "Loading..." : "Manage Subscription"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-6">
                                <h2 className="text-base font-semibold text-gray-100 mb-4">Billing History</h2>
                                <p className="text-sm text-gray-500">No invoices yet.</p>
                            </div>
                        </div>
                    )}

                    {/* ── PREFERENCES ── */}
                    {activeTab === "preferences" && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-[#1a1b1d] rounded-2xl border border-white/[0.06] p-6">
                                <h2 className="text-base font-semibold text-gray-100 mb-5">Language</h2>
                                <div className="max-w-sm">
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Interface Language</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        <select className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-gray-200 outline-none appearance-none focus:border-primary/50 transition-colors">
                                            <option value="en">English</option>
                                            <option value="fr">Français</option>
                                            <option value="es">Español</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
}
