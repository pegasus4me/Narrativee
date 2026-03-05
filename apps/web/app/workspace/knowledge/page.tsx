"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Book, ExternalLink, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";
import PrimaryButton from "@/app/components/commons/PrimaryButton";

interface Rule {
    id: string;
    content: string;
    createdAt: number;
}

interface ConnectedSource {
    type: "substack";
    name: string;
    url: string;
    imageUrl?: string;
}

interface OnboardingData {
    substackPublicationUrl?: string;
    substackPublicationName?: string;
    substackPublicationLogo?: string;
    substackProfileUrl?: string;
    substackHandle?: string;
}

export default function KnowledgeBasePage() {
    const { data: session } = authClient.useSession();
    const [rules, setRules] = useState<Rule[]>([]);
    const [newRule, setNewRule] = useState("");
    const [sources, setSources] = useState<ConnectedSource[]>([]);
    const [isLoadingSources, setIsLoadingSources] = useState(true);

    // Load rules from local storage on mount
    useEffect(() => {
        const savedRules = localStorage.getItem("narrativee_agent_rules");
        if (savedRules) {
            try {
                setRules(JSON.parse(savedRules));
            } catch (e) {
                console.error("Failed to parse rules", e);
            }
        }
    }, []);

    // Save rules to local storage whenever they change
    useEffect(() => {
        localStorage.setItem("narrativee_agent_rules", JSON.stringify(rules));
    }, [rules]);

    // Fetch connected sources (simulating based on onboarding data logic)
    useEffect(() => {
        const fetchSources = async () => {
            if (!session?.user) return;

            try {
                // In a real implementation, we might have a specific endpoint for connected sources.
                // For now, we'll try to re-use the profile fetching or just rely on what we might have stored/mocked.
                // Since the user asked specifically about the agent being trained on their substack,
                // we should try to show that connection.

                // For this implementation, we'll fetch the onboarding data if available to display it.
                // If not available, we won't show the section or show it empty.
                const res = await fetch(`${API_URL}/onboarding`, { credentials: 'include' });
                if (res.ok) {
                    const data: OnboardingData = await res.json();

                    const sourcesToAdd: ConnectedSource[] = [];

                    // Add Publication if exists
                    if (data.substackPublicationUrl) {
                        sourcesToAdd.push({
                            type: "substack",
                            name: data.substackPublicationName || "Substack Publication",
                            url: data.substackPublicationUrl,
                            imageUrl: data.substackPublicationLogo
                        });
                    }

                    // Add Profile if exists (and different from publication)
                    if (data.substackProfileUrl && data.substackProfileUrl !== data.substackPublicationUrl) {
                        sourcesToAdd.push({
                            type: "substack",
                            name: data.substackHandle ? `@${data.substackHandle}` : "Substack Profile",
                            url: data.substackProfileUrl,
                            imageUrl: "" // Profile image might be separate, backend sends logo for pub
                        });
                    }

                    if (sourcesToAdd.length > 0) {
                        setSources(sourcesToAdd);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch sources", error);
            } finally {
                setIsLoadingSources(false);
            }
        };

        fetchSources();
    }, [session]);

    const handleAddRule = () => {
        if (!newRule.trim()) return;

        const rule: Rule = {
            id: crypto.randomUUID(),
            content: newRule.trim(),
            createdAt: Date.now()
        };

        setRules([rule, ...rules]);
        setNewRule("");
    };

    const handleDeleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAddRule();
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-100 mb-2 font-urbanist">Knowledge Base</h1>
                <p className="text-gray-400">Manage the context and rules for your AI agent.</p>
            </div>

            {/* Connected Sources Section */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <Book className="w-5 h-5 text-primary" />
                    Connected Sources (Training Data)
                </h2>
                <div className="bg-primary/5 border border-primary/5 rounded-xl p-5">
                    <p className="text-sm text-primary mb-4">
                        Your agent is trained on these sources. It understands your writing style and content from here.
                    </p>

                    {isLoadingSources ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading connected sources...
                        </div>
                    ) : sources.length > 0 ? (
                        <div className="grid gap-3">
                            {sources.map((source, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-[#1e1f21] p-3 rounded-lg ">
                                    {source.imageUrl ? (
                                        <img src={source.imageUrl} alt={source.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                            <Book className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-light text-gray-200">{source.name}</h3>
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-400 flex items-center gap-1">
                                            {source.url} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-green-900/50 text-green-400 rounded-xl">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic">
                            No external sources connected yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Rules Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Custom Rules</h2>
                <div className="bg-[#1e1f21] rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-[#1a1b1c]">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="E.g. Never use passive voice, Always act as a skeptical editor..."
                                className="flex-1 p-3 border border-gray-600 bg-[#2a2b2d] text-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <PrimaryButton onClick={handleAddRule} disabled={!newRule.trim()}>
                                Add Rule
                            </PrimaryButton>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            These rules will be injected into the agent's context for every interaction.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-700">
                        {rules.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No custom rules added yet.</p>
                            </div>
                        ) : (
                            rules.map((rule) => (
                                <div key={rule.id} className="p-4 flex items-start gap-3 group hover:bg-gray-800/50 transition-colors">
                                    <div className="mt-1 w-2 h-2 " />
                                    <p className="flex-1 text-gray-300 font-light font-sans leading-relaxed">{rule.content}</p>
                                    <button
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete rule"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
