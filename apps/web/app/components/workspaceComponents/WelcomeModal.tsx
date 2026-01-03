"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, Rocket } from 'lucide-react';
import { authClient } from "@/lib/auth-client";
import { API_URL } from '@/lib/api-config';

interface WelcomeModalProps {
    open: boolean;
    onComplete: () => void;
}

export function WelcomeModal({ open, onComplete }: WelcomeModalProps) {
    const { data: session } = authClient.useSession();
    const [saasName, setSaasName] = useState('');
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    useEffect(() => {
        if (session?.user?.id && open) {
            fetchApiKey();
        }
    }, [session, open]);

    const fetchApiKey = async () => {
        try {
            const res = await fetch(`${API_URL}/api-keys`, {
                headers: {
                    'x-user-id': session?.user?.id || ''
                }
            });
            const data = await res.json() as any;
            setApiKey(data.key);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCopy = () => {
        const snippet = `<script src="https://cdn.narrativee.com/sdk.js" data-api-key="${apiKey}"></script>`;
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleComplete = () => {
        // Store onboarding completion in localStorage
        localStorage.setItem('narrativee_onboarded', 'true');
        localStorage.setItem('narrativee_saas_name', saasName);
        onComplete();
    };

    const snippet = `npm install @narrativee/sdk`;

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-manrope flex items-center gap-2">
                        Welcome to Narrativee!
                    </DialogTitle>
                </DialogHeader>

                {step === 1 ? (
                    <div className="space-y-6 py-4">
                        <p className="text-gray-600">
                            Let's get you set up in 30 seconds. First, what's your SaaS called?
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your SaaS Url
                            </label>
                            <input
                                type="text"
                                value={saasName}
                                onChange={(e) => setSaasName(e.target.value)}
                                placeholder="e.g. https://acmeapp.com"
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!saasName.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            Continue →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5 py-4 overflow-x-auto">
                        <p className="text-gray-600">
                            Great! Now integrate the SDK into <strong>{saasName}</strong> in 3 easy steps:
                        </p>

                        {/* Step 1: Install */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
                                <span className="text-sm font-medium text-gray-700">Install the package</span>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                                    npm install @narrativee/sdk</pre>
                                <button
                                    onClick={() => { navigator.clipboard.writeText('npm install @narrativee/sdk'); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                                    className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Import */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
                                <span className="text-sm font-medium text-gray-700">Import the SDK</span>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                                    {`import { narrativee } from "@narrativee/sdk"`}</pre>
                                <button
                                    onClick={() => { navigator.clipboard.writeText('import { narrativee } from "@narrativee/sdk"'); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                                    className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Step 3: Initialize */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
                                <span className="text-sm font-medium text-gray-700">Initialize with your API key</span>
                            </div>
                            <div className="relative">
                                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                                    {`narrativee.init("${apiKey || 'YOUR_API_KEY'}")`}</pre>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(`narrativee.init("${apiKey || 'YOUR_API_KEY'}")`); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                                    className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            <strong>Tip:</strong> Once installed, we'll automatically detect your SDK is connected!
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleComplete}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                                I've Added It ✓
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
