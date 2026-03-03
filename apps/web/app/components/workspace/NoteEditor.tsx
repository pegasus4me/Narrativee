"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Check, FileText } from "lucide-react";
import { cleanNote } from "@/app/actions/agent";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";
import PrimaryButton from "@/app/components/commons/PrimaryButton";

interface NoteEditorProps {
    className?: string;
}

export default function NoteEditor({ className }: NoteEditorProps) {
    const { data: session } = authClient.useSession();
    const [note, setNote] = useState("");
    const [isCleaning, setIsCleaning] = useState(false);
    const [justCopied, setJustCopied] = useState(false);

    // Context State
    const [agentContext, setAgentContext] = useState<any>({});

    useEffect(() => {
        const loadContext = async () => {
            if (typeof window === 'undefined') return;

            const rules = JSON.parse(localStorage.getItem("narrativee_agent_rules") || "[]").map((r: any) => r.content);

            let connectedSources = {};
            let platformPreferences = {};

            if (session?.user) {
                try {
                    const res = await fetch(`${API_URL}/onboarding`, { credentials: 'include' });
                    if (res.ok) {
                        const data = await res.json();
                        connectedSources = {
                            publicationName: data.substackPublicationName || data.orgName,
                            publicationUrl: data.substackPublicationUrl || data.orgUrl,
                            profileUrl: data.substackProfileUrl,
                            bio: data.substackBio
                        };
                        platformPreferences = {
                            writingStyle: data.writingStyle,
                            language: data.language
                        };
                    }
                } catch (e) { console.error(e); }
            }

            setAgentContext({
                userName: session?.user?.name,
                rules,
                connectedSources,
                platformPreferences
            });
        };
        loadContext();
    }, [session]);

    const handleClean = async () => {
        if (!note.trim()) return;

        setIsCleaning(true);
        try {
            const cleaned = await cleanNote(note, agentContext);
            setNote(cleaned);
        } catch (e) {
            console.error(e);
        } finally {
            setIsCleaning(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(note);
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
    };

    return (
        <div className={`flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">Quick Note</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        title="Copy to clipboard"
                    >
                        {justCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <PrimaryButton
                        onClick={handleClean}
                        disabled={!note.trim() || isCleaning}
                        className="h-8 text-xs px-3"
                    >
                        {isCleaning ? (
                            <Sparkles className="w-3 h-3 animate-pulse mr-1" />
                        ) : (
                            <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        {isCleaning ? "Refining..." : "Refine with Agent"}
                    </PrimaryButton>
                </div>
            </div>

            <textarea
                className="flex-1 w-full p-4 resize-none focus:outline-none text-gray-700 leading-relaxed custom-scrollbar"
                placeholder="Type your rough ideas here... The agent will help you polish them."
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />

            <div className="p-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
                Drafts are ephemeral (for now). Copy nicely refined notes elsewhere.
            </div>
        </div>
    );
}
