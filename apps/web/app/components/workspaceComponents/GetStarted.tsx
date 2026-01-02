"use client"
import { useState, useEffect } from 'react';
import { Copy, Code, Terminal, Smartphone } from 'lucide-react';
import { authClient } from "@/lib/auth-client";
import { TwoCircleIcon } from 'clicons-react';

export default function GetStarted() {
    const { data: session } = authClient.useSession();
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedEvent, setCopiedEvent] = useState(false);
    const [activeTab, setActiveTab] = useState<'html' | 'react'>('html');

    useEffect(() => {
        if (session?.user?.id) {
            fetchApiKey();
        }
    }, [session]);

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

    const scriptCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://narrativee.com'}/services/sdk.js" data-api-key="${apiKey || 'YOUR_API_KEY'}"></script>`;

    const eventCode = `<script>
  window.narrativee.event('view_dashboard', { 
    userId: 'user_123',
    plan: 'free' 
  });
</script>`;

    const reactInstallCode = `npm install @narrativee/sdk`;

    const reactUsageCode = `import { narrativee } from '@narrativee/sdk';

// Initialize once (e.g. in your root layout or app)
narrativee.init('${apiKey || 'YOUR_API_KEY'}');

// Track Events
export function Dashboard() {
  useEffect(() => {
    narrativee.event('view_dashboard', { 
      userId: 'user_123' 
    });
  }, []);
  
  return <div>Dashboard</div>;
}`;


    const reactWorkflowCode = `import { NarrativeeTrigger } from '@narrativee/sdk';
    import { UpgradeModal } from './components/UpgradeModal';

    // In your app, wrap your component with the Trigger
    // This will ONLY render <UpgradeModal> when the 'vip-modal' workflow triggers.
    export function App() {
        return (
            <>
                <NarrativeeTrigger
                    id="vip-modal"
                    component={<UpgradeModal />}
                />
                {/* ... rest of your app */}
            </>
        );
    } `;

    const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 font-manrope">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg text-contrast">
                        <TwoCircleIcon size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 font-urbanist">Install & Track</h3>
                        <p className="text-sm text-gray-500">Choose your integration method.</p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('html')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'html' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        HTML Snippet
                    </button>
                    <button
                        onClick={() => setActiveTab('react')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'react' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        React / NPM
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {activeTab === 'html' ? (
                    <>
                        {/* HTML Steps */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Code size={16} className="text-gray-400" />
                                    1. Add to &lt;head&gt;
                                </label>
                                <button
                                    onClick={() => handleCopy(scriptCode, setCopiedScript)}
                                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    {copiedScript ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy code</>}
                                </button>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                {scriptCode}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Terminal size={16} className="text-gray-400" />
                                    2. Track an Event
                                </label>
                                <button
                                    onClick={() => handleCopy(eventCode, setCopiedEvent)}
                                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    {copiedEvent ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy code</>}
                                </button>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                {eventCode}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* React Steps */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Code size={16} className="text-gray-400" />
                                    1. install narrativee sdk
                                </label>
                                <button
                                    onClick={() => handleCopy(reactInstallCode, setCopiedScript)}
                                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    {copiedScript ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy code</>}
                                </button>
                            </div>
                            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto max-h-[200px]">
                                {reactInstallCode}
                            </pre>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Terminal size={16} className="text-gray-400" />
                                    2. Usage
                                </label>
                                <button
                                    onClick={() => handleCopy(reactUsageCode, setCopiedEvent)}
                                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    {copiedEvent ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy code</>}
                                </button>
                            </div>
                            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto">
                                {reactUsageCode}
                            </pre>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Smartphone size={16} className="text-gray-400" />
                                    3. Integrate Workflows (Optional)
                                </label>
                                <button
                                    onClick={() => handleCopy(reactWorkflowCode, setCopiedEvent)}
                                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    {copiedEvent ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy code</>}
                                </button>
                            </div>
                            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto">
                                {reactWorkflowCode}
                            </pre>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
