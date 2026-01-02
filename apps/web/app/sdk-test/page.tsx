"use client";

import { useEffect, useState } from "react";
import { narrativee } from "@narrativee/sdk";
import { NarrativeeTrigger } from "@narrativee/sdk/react";
import { authClient } from "@/lib/auth-client";
import { X, Sparkles } from "lucide-react";

// Fake Popup Component
const PromoPopup = () => {
    const [open, setOpen] = useState(true);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-300 scale-100">
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <Sparkles size={32} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">SDK Magic! ✨</h2>
                        <p className="text-gray-600 mt-2">
                            This popup was triggered by the backend logic via the React SDK.
                        </p>
                    </div>

                    <button
                        onClick={() => setOpen(false)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Get pricing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function SDKTestPage() {
    const { data: session } = authClient.useSession();
    const [status, setStatus] = useState("Initializing...");

    useEffect(() => {
        // Initialize SDK
        narrativee.init("nr-live-a969db13-6a4e-42c4-825e-9101a32dffe8");

        if (session?.user?.id) {
            narrativee.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
                plan: session.user.plan
            });
            setStatus("Ready. User Identified.");
        } else {
            setStatus("Waiting for session...");
        }
    }, [session]);

    const handleTrigger = async () => {
        setStatus("Tracking event: view_pricing...");
        await narrativee.event("view_pricing", { source: "sdk-test-page" });
        setStatus("Event sent!");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-manrope">
            {/* NarrativeeTrigger now uses the shared singleton - should work with v1.0.2! */}
            <NarrativeeTrigger id="vip-modal" component={<PromoPopup />} />

            <div className="max-w-xl w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 font-geist-mono">SDK Integration Test</h1>

                <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-600 font-mono">
                    Status: <span className="text-indigo-600 font-bold">{status}</span>
                </div>

                <p className="text-gray-600">
                    Click the button below to simulate visiting the pricing page.
                    If the workflow is active, you should see a popup!
                </p>

                <button
                    onClick={handleTrigger}
                    className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                    Trigger "view_pricing" Event
                </button>

                <div className="text-xs text-gray-400 mt-8">
                    SDK v1.0.2 • @narrativee/sdk
                </div>
            </div>
        </div>
    );
}

