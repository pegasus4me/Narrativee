"use client"
import { useState, useEffect } from 'react';
import { Copy, Code, Terminal, Smartphone } from 'lucide-react';
import { authClient } from "@/lib/auth-client";
import { TwoCircleIcon } from 'clicons-react';
import { API_URL } from '@/lib/api-config';

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


    const reactWorkflowCode = `import { NarrativeeTrigger } from '@narrativee/sdk/react';

<NarrativeeTrigger 
    id="trigger_id" 
    component={<PersonalizedUpsellPopup />} 
/>
`;

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
                        onClick={() => setActiveTab('react')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'react' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        React / NPM
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <>
                    {/* React Steps */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Code size={16} className="text-indigo-500" />
                                1. Install Narrativee SDK
                            </label>
                            <button
                                onClick={() => handleCopy(reactInstallCode, setCopiedScript)}
                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                {copiedScript ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy</>}
                            </button>
                        </div>
                        <pre className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                            <code className="text-green-400">{reactInstallCode}</code>
                        </pre>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Terminal size={16} className="text-purple-500" />
                                2. Initialize & Track Events
                            </label>
                            <button
                                onClick={() => handleCopy(reactUsageCode, setCopiedEvent)}
                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                {copiedEvent ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy</>}
                            </button>
                        </div>
                        <pre className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                            <code>
                                <span className="text-purple-400">import</span> <span className="text-gray-300">{'{'}</span> <span className="text-yellow-300">narrativee</span> <span className="text-gray-300">{'}'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@narrativee/sdk'</span><span className="text-gray-300">;</span>{'\n\n'}
                                <span className="text-gray-500">// Initialize once (e.g. in your root layout)</span>{'\n'}
                                <span className="text-yellow-300">narrativee</span><span className="text-gray-300">.</span><span className="text-blue-400">init</span><span className="text-gray-300">(</span><span className="text-green-400">'{apiKey || 'YOUR_API_KEY'}'</span><span className="text-gray-300">);</span>{'\n\n'}
                                <span className="text-gray-500">// Track Events anywhere</span>{'\n'}
                                <span className="text-yellow-300">narrativee</span><span className="text-gray-300">.</span><span className="text-blue-400">event</span><span className="text-gray-300">(</span><span className="text-green-400">'view_dashboard'</span><span className="text-gray-300">, {'{'}</span>{'\n'}
                                <span className="text-gray-300">  userId: </span><span className="text-green-400">'user_123'</span>{'\n'}
                                <span className="text-gray-300">{'}'})</span><span className="text-gray-300">;</span>
                            </code>
                        </pre>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Smartphone size={16} className="text-orange-500" />
                                3. Integrate Workflows
                            </label>
                            <button
                                onClick={() => handleCopy(reactWorkflowCode, setCopiedEvent)}
                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                {copiedEvent ? <span className="text-green-600">Copied!</span> : <><Copy size={12} /> Copy</>}
                            </button>
                        </div>
                        <pre className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                            <code>
                                <span className="text-purple-400">import</span> <span className="text-gray-300">{'{'}</span> <span className="text-yellow-300">NarrativeeTrigger</span> <span className="text-gray-300">{'}'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@narrativee/sdk/react'</span><span className="text-gray-300">;</span>{'\n\n'}
                                <span className="text-gray-300">{'<'}</span><span className="text-blue-400">NarrativeeTrigger</span> {'\n'}
                                <span className="text-gray-300">    id=</span><span className="text-green-400">"trigger_id"</span> {'\n'}
                                <span className="text-gray-300">    component={'={<'}</span><span className="text-yellow-300">PersonalizedUpsellPopup</span><span className="text-gray-300"> {'/>'}</span> {'\n'}
                                <span className="text-gray-300">{'/>'}</span>
                            </code>
                        </pre>
                    </div>
                </>

            </div>
        </div>
    );
}
