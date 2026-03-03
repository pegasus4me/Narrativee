"use client";

import { useEffect, useState } from "react";
import { NotesAPI, Note } from "@/lib/api/posts";
import { format } from "date-fns";
import { RefreshCw, ExternalLink, ThumbsUp, MessageSquare, Repeat2, FileText } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";

export function NotesList() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [onboardingData, setOnboardingData] = useState<any>({});
    const { data: session } = authClient.useSession();
    const [showAll, setShowAll] = useState(false);
    const fetchNotes = async () => {
        try {
            setLoading(true);
            const data = await NotesAPI.getNotes();
            setNotes(data);
        } catch (error) {
            console.error("Failed to fetch notes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetch(`${API_URL}/onboarding`, { credentials: "include" })
                .then((res) => res.json())
                .then((data) => setOnboardingData(data))
                .catch(console.error);
        }
    }, [session?.user]);

    useEffect(() => {
        fetchNotes();

        // Listen for scraped notes from extension
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === "NARRATIVEE_NOTES_PERF_SCRAPED") {
                const scrapedNotes = event.data.notes || [];
                console.log("📝 Received", scrapedNotes.length, "notes from extension");

                if (event.data.error && scrapedNotes.length === 0) {
                    toast.error(`Sync failed: ${event.data.error}`);
                    setSyncing(false);
                    return;
                }

                if (scrapedNotes.length === 0) {
                    toast.info("No notes found on your Substack profile page.");
                    setSyncing(false);
                    return;
                }

                try {
                    const result = await NotesAPI.syncNotes(scrapedNotes);
                    toast.success(`Synced ${result.count} notes successfully!`);
                    fetchNotes();
                } catch (error) {
                    console.error("Notes sync failed", error);
                    toast.error("Failed to save notes to backend");
                } finally {
                    setSyncing(false);
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleSync = async () => {
        const profileUrl = onboardingData?.substackProfileUrl;
        if (!profileUrl) {
            toast.error("No Substack profile URL found. Please complete onboarding first.");
            return;
        }
        try {
            setSyncing(true);
            // Always clear first so stale/wrong notes are wiped before the fresh scrape
            await NotesAPI.clearNotes();
            setNotes([]);
            window.postMessage(
                { type: "NARRATIVEE_START_NOTES_PERF_SYNC", profileUrl },
                "*"
            );
            // Safety timeout
            setTimeout(() => setSyncing(false), 90000);
        } catch (error) {
            console.error("Sync failed", error);
            toast.error("Sync failed");
            setSyncing(false);
        }
    };

    if (loading && notes.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 animate-pulse bg-[#1e1f21] rounded-xl border border-gray-800">
                Loading notes performance...
            </div>
        );
    }

    return (
        <div className="bg-[#1e1f21] rounded-lg bg-tertiary overflow-hidden">
            {/* Sync button */}
            <div className="flex justify-end mb-3">
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-900/20 text-violet-400 rounded-lg hover:bg-violet-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-violet-800/50"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync Notes"}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/50 text-gray-400">
                        <tr>
                            <th className="px-6 py-4 font-medium border-b border-gray-800">Note Preview</th>
                            <th className="px-6 py-4 font-medium border-b border-gray-800">Date</th>
                            <th className="px-6 py-4 font-medium text-right border-b border-gray-800">Likes</th>
                            <th className="px-6 py-4 font-medium text-right border-b border-gray-800">Comments</th>
                            <th className="px-6 py-4 font-medium text-right border-b border-gray-800">Restacks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {(showAll ? notes : notes.slice(0, 5)).map((note) => (
                            <tr key={note.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-200 text-sm line-clamp-2 leading-snug">
                                            {note.contentPreview || "—"}
                                        </span>
                                        {note.url && (
                                            <a
                                                href={note.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-0.5"
                                            >
                                                View Note <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                    {note.publishedAt
                                        ? format(new Date(note.publishedAt), "MMM d, yyyy")
                                        : "—"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-gray-200 font-medium">
                                        <ThumbsUp className="w-4 h-4 text-gray-500" />
                                        {(note.likes ?? 0).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-gray-200 font-medium">
                                        <MessageSquare className="w-4 h-4 text-gray-500" />
                                        {(note.comments ?? 0).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-gray-200 font-medium">
                                        <Repeat2 className="w-4 h-4 text-gray-500" />
                                        {(note.restacks ?? 0).toLocaleString()}
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {notes.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No notes synced yet. Click &quot;Sync Notes&quot; to import your Substack Notes performance.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Show More */}
            {notes.length > 5 && (
                <div className="flex justify-center py-3 border-t border-gray-800">
                    <button
                        onClick={() => setShowAll(v => !v)}
                        className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                    >
                        {showAll ? "Show less" : `Show more (${notes.length - 5} more)`}
                    </button>
                </div>
            )}
        </div>
    );
}
