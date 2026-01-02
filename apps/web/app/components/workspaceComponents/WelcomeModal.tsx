"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, Rocket } from 'lucide-react';
import { authClient } from "@/lib/auth-client";

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
            const res = await fetch('http://localhost:3002/api/api-keys', {
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

    const snippet = `<script src="https://cdn.narrativee.com/sdk.js" data-api-key="${apiKey || 'YOUR_API_KEY'}"></script>`;

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
                                Your SaaS Name
                            </label>
                            <input
                                type="text"
                                value={saasName}
                                onChange={(e) => setSaasName(e.target.value)}
                                placeholder="e.g. Leadverse, Acme App"
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
                    <div className="space-y-6 py-4 overflow-x-auto">
                        <p className="text-gray-600">
                            Great! Now add this snippet to <strong>{saasName}</strong>'s <code className="bg-gray-100 px-1 rounded">{`<head>`}</code> tag:
                        </p>

                        <div className="relative">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                                {snippet}
                            </pre>
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                            <strong>Tip:</strong> Once installed, we'll automatically detect your SDK is connected and update your dashboard!
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
