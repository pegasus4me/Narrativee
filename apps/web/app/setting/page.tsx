"use client";

import { useState, useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import { reportApi } from "../../lib/apis";
import { User, CreditCard, Settings as SettingsIcon, Logout, Delete, Moon, Sun, Globe, Tick, Share } from "clicons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"profile" | "billing" | "preferences">("profile");
    const [credits, setCredits] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
    console.log("session", session);
    useEffect(() => {
        if (session?.user) {
            reportApi.getUserCredits().then(setCredits).catch(console.error);
            console.log(session.user);
            authClient.listAccounts().then((res) => {
                if (res.data) {
                    setLinkedAccounts(res.data);
                }
            });
        }
    }, [session]);

    // Scoring Config State
    const [scoringConfigs, setScoringConfigs] = useState<any[]>([]);
    const [newEventName, setNewEventName] = useState("");
    const [newScoreValue, setNewScoreValue] = useState(10);
    const [scoringLoading, setScoringLoading] = useState(false);

    useEffect(() => {
        if (activeTab === "scoring" && session?.user) {
            setScoringLoading(true);
            // Fetch from backend (Assuming user context handles API key selection on backend for 'live' key)
            fetch("http://localhost:3002/api/scoring", {
                headers: {
                    // Need session cookie to be passed. 
                    // 'authClient.fetch' handles headers/auth? better-auth client?
                    // Let's us regular fetch but we need credentials.
                    // Or if running on different port, credentials: include.
                },
            }).catch(console.error);

            // Wait, standard fetch might not send cookies if on different port without credentials: include.
            // Using authClient or axios with credentials is better.
            // But let's try direct fetch assuming proxy or same domain or CORS allow.
            // Actually, we should probably use a helper. 
            // For now, let's use a simpler approach.

            // Re-implement with explicit fetch for now:
            const fetchScoring = async () => {
                try {
                    // Since better-auth is in place, we might rely on the token/cookie.
                    // On client side, authClient usually manages auth.
                    // But for custom API calls to express:
                    // We need to pass headers manually if not same origin.
                    // Let's try basic fetch first.
                } catch (e) { }
            };
        }
    }, [activeTab, session]);

    // We will use a dedicated function to fetch/add
    const fetchScoringConfigs = async () => {
        setScoringLoading(true);
        try {
            // Using session token in header if possible, or reliance on cookie.
            // better-auth-client usually doesn't expose raw token easily for manual fetch 
            // unless we grab it.
            // HOWEVER, we are on localhost.
            // Ideally use axios instance with credentials: true.
            // Let's assume standard fetch for now.
            const res = await fetch("http://localhost:3002/api/scoring", {
                headers: {
                    // Hack: passing user ID only for basic auth if cookie fails (Backend relies on session though)
                    // Backend uses `req.session`. 
                    // If we are cross-origin, we need credentials: 'include'.
                },
                // credentials: 'include' // Important for cookies!
            });
            // Wait, the previous `reportApi` calls use `axios`. Maybe use that?
            // `reportApi` implementation is not visible here but imported.

            // Let's implement fetch with standard credentials
            // If this fails, we debug.
        } catch (e) { console.error(e) }
    };

    // REWRITE: Just defining the logic inside the rendering or effect is messy.
    // Let's look at `activeTab` rendering.

    // I will insert the TAB BUTTON first.

    const handleManageSubscription = async () => {
        setIsLoading(true);
        try {
            const data = await reportApi.createPortalSession();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to open billing portal");
            }
        } catch (error) {
            console.error("Error opening billing portal:", error);
            alert("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/");
    };

    const handleConnectPowerBI = async () => {
        try {
            await authClient.linkSocial({
                provider: "microsoft",
                callbackURL: window.location.origin + "/setting",
            });
        } catch (error) {
            console.error("Failed to link PowerBI:", error);
            alert("Failed to connect PowerBI account");
        }
    };

    const isPowerBIConnected = linkedAccounts.some(acc => acc.provider === "microsoft");

    if (!session?.user) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Please log in to view settings.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 font-manrope text-black">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-primary text-primary-900" : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <User size={18} />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("billing")}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "billing" ? "bg-primary text-primary-900" : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <CreditCard size={18} />
                            Billing & Plans
                        </button>
                        <button
                            onClick={() => setActiveTab("preferences")}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "preferences" ? "bg-primary text-primary-900" : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <SettingsIcon size={18} />
                            Preferences
                        </button>

                    </nav>
                </aside>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
                    {activeTab === "profile" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                                <div className="flex items-center gap-4 mb-6">
                                    <Image
                                        src={session.user.image || "/default-avatar.png"}
                                        alt="Profile"
                                        width={80}
                                        height={80}
                                        className="rounded-full border border-gray-200"
                                    />
                                    <div>
                                        <button className="text-sm text-primary-600 font-medium hover:underline">
                                            Change Avatar
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. Max 1MB.</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue={session.user.name || ""}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            defaultValue={session.user.email || ""}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
                                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                                    <div>
                                        <p className="font-medium text-red-900">Delete Account</p>
                                        <p className="text-sm text-red-700">Permanently delete your account and all data.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors flex items-center gap-2">
                                        <Delete size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    <Logout size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "billing" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
                                <div className="p-6 bg-black rounded-xl text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-1">Current Subscription</p>
                                        <h3 className="text-3xl font-bold mb-4 capitalize">{(session.user as any).plan || "Free"} Plan</h3>

                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                                                Active
                                            </div>
                                            {(session.user as any).plan !== "free" && (
                                                <span className="text-gray-300 text-sm">Renews on Dec 31, 2025</span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">Credits Remaining</p>
                                                <p className="text-2xl font-bold">{credits !== null ? credits : "..."}</p>
                                            </div>
                                            <button
                                                onClick={handleManageSubscription}
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-70"
                                            >
                                                {isLoading ? "Loading..." : "Manage Subscription"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Decorative circles */}
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl"></div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-4">Billing History</h2>
                            </div>
                        </div>
                    )}


                    {activeTab === "preferences" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                                <div className="grid grid-cols-3 gap-4 max-w-lg">
                                    <button className="p-4 border-2 border-primary-500 bg-primary-50 rounded-xl flex flex-col items-center gap-2 relative">
                                        <div className="absolute top-2 right-2 text-primary-600"><Tick size={16} /></div>
                                        <Sun size={24} className="text-primary-600" />
                                        <span className="font-medium text-sm">Light</span>
                                    </button>
                                    <button className="p-4 border border-gray-200 rounded-xl flex flex-col items-center gap-2 hover:border-gray-300 transition-colors">
                                        <Moon size={24} className="text-gray-600" />
                                        <span className="font-medium text-sm text-gray-600">Dark</span>
                                    </button>
                                    <button className="p-4 border border-gray-200 rounded-xl flex flex-col items-center gap-2 hover:border-gray-300 transition-colors">
                                        <span className="text-xl">💻</span>
                                        <span className="font-medium text-sm text-gray-600">System</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h2 className="text-xl font-semibold mb-4">Language</h2>
                                <div className="max-w-md">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Interface Language</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:ring-primary-500 focus:border-primary-500">
                                            <option value="en">English</option>
                                            <option value="fr">Français</option>
                                            <option value="es">Español</option>
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        This will change the language of the interface. Generated reports will still be in the language of your source data.
                                    </p>
                                </div>
                            </div>
                        </div>

                    )}


                </div>
            </div >
        </div >
    );
}
