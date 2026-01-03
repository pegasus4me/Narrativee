"use client"
import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Key } from 'lucide-react'; // Assuming lucide-react is installed, else use clicons or similar
import { authClient } from "@/lib/auth-client"; // Adjust path as needed
import PrimaryButton from '../commons/PrimaryButton';
import { OneCircleIcon, ChevronDownIcon, ArrowUpIcon } from 'clicons-react';
import { API_URL } from '@/lib/api-config';
// import { Button } from "@/components/ui/button"; // Adjust if you have shadcn components

export default function GenerateApiKey() {
    const { data: session } = authClient.useSession();
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchApiKey();
        }
    }, [session]);

    const fetchApiKey = async () => {
        try {
            // NOTE: In production, session cookie handles auth, but for our mockAuth middleware
            // we pass the user ID in header as discussed.
            const res = await fetch(`${API_URL}/api-keys`, {
                headers: {
                    'x-user-id': session?.user?.id || ''
                }
            });
            const data = await res.json() as any;
            setApiKey(data.key);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const regenerateKey = async () => {
        if (!confirm("Are you sure? This will revoke your old key immediately.")) return;

        setRegenerating(true);
        try {
            const res = await fetch(`${API_URL}/api-keys/regenerate`, {
                method: 'POST',
                headers: {
                    'x-user-id': session?.user?.id || ''
                }
            });
            const data = await res.json() as any;
            setApiKey(data.key);
        } catch (err) {
            console.error(err);
        } finally {
            setRegenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            alert("Copied!");
        }
    };

    if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>;

    return (
        <div className="bg-white p-2 rounded-md border-gray-100 font-manrope" >
            <div className="mb-2">
                <div className="flex items-center justify-between">
                    <div className="p-1">
                        <h3 className="font-semibold text-gray-900 font-urbanist">Your API Key</h3>
                        <p className="text-sm text-gray-500">Use this key to integrate the SDK.</p>
                    </div>
                    <div onClick={() => setOpen(!open)}>
                        <ChevronDownIcon size={20} />
                    </div>
                </div>
            </div>
            {open && (
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-600 flex items-center justify-between">
                        <span>
                            {apiKey ? (showKey ? apiKey : 'nr-live-••••••••••••••••••••••••') : "No API Key active"}
                        </span>
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            {showKey ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {apiKey && (
                        <button
                            onClick={copyToClipboard}
                            className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copy to clipboard"
                        >
                            <Copy size={18} />
                        </button>
                    )}

                    <button
                        onClick={regenerateKey}
                        disabled={regenerating}
                        className={`p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${regenerating ? 'animate-spin' : ''}`}
                        title="Regenerate Key"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            )}
            {!apiKey ? (
                <PrimaryButton
                    onClick={regenerateKey}
                    className="mt-4 w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                    Generate First Key
                </PrimaryButton>
            ) : null}
        </div>
    );
}
