"use client";

import { useState, useEffect } from "react";
import { Loader2, Rss, TrendingUp, MessageSquare, Clock, Zap, Search, Users } from "lucide-react";
import EngagementCard from "@/app/components/workspace/EngagementCard";
import { generateEngagementComment } from "@/app/actions/engage";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";
import { useSideBarStore } from "@/app/state/SideBar.store";

interface EngagementNote {
    id: string;
    content: string;
    author: {
        name: string;
        handle: string;
        avatar: string;
    };
    engagement: {
        likes: number;
        restacks: number;
        comments: number;
    };
    totalEngagement: number;
    url: string;
    timestamp: string;
}

type SortMode = "engagement" | "recent" | "comments";

export default function EngagePage() {
    const [notes, setNotes] = useState<EngagementNote[]>([]);
    const [skipped, setSkipped] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>("engagement");
    const [error, setError] = useState<string | null>(null);

    // Author search state
    const [searchAuthor, setSearchAuthor] = useState("");
    const [isAuthorSearching, setIsAuthorSearching] = useState(false);
    const [commentedCount, setCommentedCount] = useState(0);
    const [lastPulled, setLastPulled] = useState<Date | null>(null);
    const { data: session } = authClient.useSession();
    const [onboardingData, setOnboardingData] = useState<any>({});

    useEffect(() => {
        if (session?.user) {
            fetch(`${API_URL}/onboarding`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => setOnboardingData(data))
                .catch(console.error);
        }
    }, [session?.user]);

    useEffect(() => {
        const savedNotes = localStorage.getItem('narrativee_engage_notes');
        const savedTime = localStorage.getItem('narrativee_engage_pulled_at');
        if (savedNotes) {
            try { setNotes(JSON.parse(savedNotes)); } catch (e) { }
        }
        if (savedTime) setLastPulled(new Date(savedTime));
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;
            if (event.data?.type === 'NARRATIVEE_ENGAGEMENT_FEED_LOADED') {
                const loadedNotes = event.data.notes || [];
                setNotes(loadedNotes);
                setSkipped(new Set());
                const now = new Date();
                setLastPulled(now);
                localStorage.setItem('narrativee_engage_notes', JSON.stringify(loadedNotes));
                localStorage.setItem('narrativee_engage_pulled_at', now.toISOString());
                setIsLoading(false);
                setError(null);
            }
            // Author search results
            if (event.data?.type === 'NARRATIVEE_AUTHOR_SEARCH_RESULTS') {
                const loadedNotes: EngagementNote[] = event.data.notes || [];
                setNotes(loadedNotes);
                setSkipped(new Set());
                const now = new Date();
                setLastPulled(now);
                localStorage.setItem('narrativee_engage_notes', JSON.stringify(loadedNotes));
                localStorage.setItem('narrativee_engage_pulled_at', now.toISOString());
                setIsAuthorSearching(false);
                if (event.data.error) {
                    setError(event.data.error);
                } else if (loadedNotes.length === 0) {
                    setError(`No notes found for @${event.data.authorHandle}.`);
                } else {
                    setError(null);
                }
            }
            if (event.data?.type === 'NARRATIVEE_COMMENT_POSTED' && event.data.success) {
                setCommentedCount(prev => prev + 1);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handlePullFeed = () => {
        setIsLoading(true);
        setError(null);
        window.postMessage({ type: 'NARRATIVEE_PULL_ENGAGEMENT_FEED' }, '*');
        setTimeout(() => {
            setIsLoading((prev) => {
                if (prev) { setError("Feed scrape timed out. Make sure the extension is installed."); return false; }
                return prev;
            });
        }, 60000);
    };

    const handleAuthorSearch = () => {
        const handle = searchAuthor.trim().replace(/^@/, "");
        if (!handle) return;
        setIsAuthorSearching(true);
        setError(null);
        setNotes([]);
        setSkipped(new Set());
        window.postMessage({ type: 'NARRATIVEE_SEARCH_AUTHOR_NOTES', authorHandle: handle }, '*');
        setTimeout(() => {
            setIsAuthorSearching((prev) => {
                if (prev) { setError("Author search timed out. Make sure the extension is installed."); return false; }
                return prev;
            });
        }, 60000);
    };

    const handleGenerateComment = async (note: EngagementNote): Promise<string> => {
        const currentCredits = useSideBarStore.getState().credits;
        if (currentCredits !== null && currentCredits < 1) throw new Error("Insufficient credits. Please upgrade your plan.");

        const deductRes = await fetch(`${API_URL}/user/credits/deduct`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: 1 }), credentials: 'include'
        });
        const deductData = await deductRes.json() as any;
        if (!deductData.success) throw new Error(deductData.error || "Failed to deduct credits");
        useSideBarStore.getState().setCredits(deductData.credits);

        return await generateEngagementComment({
            noteContent: note.content,
            authorName: note.author.name,
            authorHandle: note.author.handle,
            userBio: onboardingData.substackBio,
            writingStyle: onboardingData.writingStyle,
            language: onboardingData.language,
        }, {
            rules: [],
            connectedSources: { publicationName: onboardingData.substackPublicationName, bio: onboardingData.substackBio },
            platformPreferences: { language: onboardingData.language, writingStyle: onboardingData.writingStyle },
        });
    };

    const handlePostComment = (noteUrl: string, comment: string) => {
        window.postMessage({ type: 'NARRATIVEE_POST_COMMENT', noteUrl, comment, autoPost: true }, '*');
    };

    const handleSkip = (noteId: string) => {
        setSkipped(prev => new Set(prev).add(noteId));
    };

    const userHandle = onboardingData.substackHandle || onboardingData.substackProfileUrl?.split('@').pop()?.split('/')[0];

    const filteredNotes = [...notes]
        .filter(n => !skipped.has(n.id))
        .filter(n => !(userHandle && n.author.handle === userHandle))
        .sort((a, b) => {
            if (sortMode === "engagement") return b.totalEngagement - a.totalEngagement;
            if (sortMode === "comments") return b.engagement.comments - a.engagement.comments;
            return 0;
        });

    const sortButtons: { mode: SortMode; label: string; icon: React.ReactNode }[] = [
        { mode: "engagement", label: "Top", icon: <TrendingUp className="w-3 h-3" /> },
        { mode: "comments", label: "Most discussed", icon: <MessageSquare className="w-3 h-3" /> },
        { mode: "recent", label: "Recent", icon: <Clock className="w-3 h-3" /> },
    ];

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-100">Engagement Autopilot</h1>
                        <p className="text-sm text-gray-500 mt-1">Comment on trending notes to grow your visibility on Substack.</p>
                    </div>
                    {commentedCount > 0 && (
                        <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/30 rounded-xl px-4 py-2">
                            <Zap className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-sm font-semibold">{commentedCount} posted today</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={handlePullFeed}
                        disabled={isLoading || isAuthorSearching}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.06] text-gray-200 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rss className="w-4 h-4 text-orange-400" />}
                        {isLoading ? "Pulling feed..." : "Pull Feed"}
                    </button>

                    <span className="text-xs text-gray-600">or</span>

                    {/* Author search */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                            <input
                                type="text"
                                value={searchAuthor}
                                onChange={e => setSearchAuthor(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleAuthorSearch(); }}
                                placeholder="author handle"
                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl pl-7 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-40"
                            />
                        </div>
                        <button
                            onClick={handleAuthorSearch}
                            disabled={isAuthorSearching || !searchAuthor.trim() || isLoading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-xl transition-all disabled:opacity-40"
                        >
                            {isAuthorSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                            {isAuthorSearching ? "Looking up..." : "Pull notes"}
                        </button>
                    </div>

                    {notes.length > 0 && (
                        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-1">
                            {sortButtons.map(({ mode, label, icon }) => (
                                <button
                                    key={mode}
                                    onClick={() => setSortMode(mode)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${sortMode === mode ? "bg-white/10 text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    {icon} {label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="ml-auto flex items-center gap-3 text-xs text-gray-600">
                        {lastPulled && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Last pulled {lastPulled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {filteredNotes.length > 0 && <span>{filteredNotes.length} notes</span>}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isAuthorSearching && notes.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-14 h-14 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-center">
                            <Rss className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-gray-300 font-medium mb-1">No notes loaded yet</h3>
                            <p className="text-gray-600 text-sm max-w-xs">Click "Pull Feed" to scrape trending notes from your Substack feed. The extension will open a tab, scrape, and return the results.</p>
                        </div>
                        <button
                            onClick={handlePullFeed}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-sm font-medium rounded-xl transition-all"
                        >
                            <Rss className="w-4 h-4" /> Pull Feed
                        </button>
                    </div>
                )}

                {/* Loading */}
                {(isLoading || isAuthorSearching) && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
                        <p className="text-gray-400 text-sm">{isAuthorSearching ? `Looking up @${searchAuthor.replace(/^@/, '')}...` : "Scraping your Substack feed..."}</p>
                        <p className="text-gray-600 text-xs">{isAuthorSearching ? "Resolving profile and fetching notes" : "This may take 20–30 seconds"}</p>
                    </div>
                )}

                {/* Notes Grid */}
                {filteredNotes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredNotes.map(note => (
                            <EngagementCard
                                key={note.id}
                                note={note}
                                onGenerateComment={handleGenerateComment}
                                onPostComment={handlePostComment}
                                onSkip={handleSkip}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
