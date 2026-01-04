import { AlertCircle, Clock, Download, Sparkles, X } from "clicons-react";
import { useState } from "react";

// Mock data
export const recentTransactions = [
    { id: 1, customer: "Sarah Johnson", email: "sarah@company.com", amount: 299, status: "success", time: "2 min ago" },
    { id: 2, customer: "Mike Chen", email: "mike@startup.io", amount: 99, status: "success", time: "15 min ago" },
    { id: 3, customer: "Emma Davis", email: "emma@agency.co", amount: 199, status: "pending", time: "1 hour ago" },
    { id: 4, customer: "Alex Turner", email: "alex@tech.dev", amount: 499, status: "success", time: "3 hours ago" },
];

export const recentActivity = [
    { action: "New signup", detail: "john@example.com joined", time: "Just now" },
    { action: "Upgrade", detail: "Pro plan activated", time: "5 min ago" },
    { action: "Export", detail: "Q4 report downloaded", time: "12 min ago" },
    { action: "Integration", detail: "Slack connected", time: "1 hour ago" },
];

// Upgrade Popup Component (triggered by Narrativee)
export const UpgradePopup = () => {
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

// Personalized Upsell Popup (triggered after using export feature multiple times)
export const PersonalizedUpsellPopup = () => {
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
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl text-white shadow-lg shadow-blue-500/25">
                        <Download size={28} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">You've exported 3 reports! 📊</h2>
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                            Looks like you love exporting data. Pro users get <strong>unlimited exports</strong> + automated scheduling.
                        </p>
                    </div>

                    <div className="w-full pt-2 space-y-2">
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl transition-all text-sm"
                        >
                            Get Unlimited Exports — $29/mo
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

// Time-Sensitive Offer Popup (urgency-based conversion)
export const TimeSensitivePopup = () => {
    const [open, setOpen] = useState(true);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 bg-white/20 rounded-2xl text-white backdrop-blur-sm">
                        <Clock size={28} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-white">⏰ Trial Ending Soon!</h2>
                        <p className="text-white/80 mt-2 text-sm leading-relaxed">
                            Your free trial expires in <strong>2 days</strong>. Lock in 20% off if you upgrade now!
                        </p>
                    </div>

                    <div className="w-full pt-2 space-y-2">
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full py-3 bg-white hover:bg-gray-100 text-orange-600 font-semibold rounded-xl transition-colors text-sm"
                        >
                            Claim 20% Off — $23/mo
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full py-2 text-white/60 hover:text-white text-sm"
                        >
                            I'll risk missing the offer
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-white/60 text-xs">
                        <AlertCircle size={12} />
                        <span>Offer expires in 47:32:15</span>
                    </div>
                </div>
            </div>
        </div>
    );
};