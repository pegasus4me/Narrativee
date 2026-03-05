"use client";

import { useState, useEffect } from "react";
import { Loader2, Rss, TrendingUp, Filter, MessageSquare } from "lucide-react";
import EngagementCard from "@/app/components/workspace/EngagementCard";
import { generateEngagementComment } from "@/app/actions/agent";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";

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
    const [isLoading, setIsLoading] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>("engagement");
    const [error, setError] = useState<string | null>(null);
    const [commentedCount, setCommentedCount] = useState(0);
    const { data: session } = authClient.useSession();

    // User context for AI generation
    const [onboardingData, setOnboardingData] = useState<any>({});

    useEffect(() => {
        if (session?.user) {
            fetch(`${API_URL}/onboarding`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => setOnboardingData(data))
                .catch(console.error);
        }
    }, [session?.user]);

    // Load persisted notes
    useEffect(() => {
        const savedNotes = localStorage.getItem('narrativee_engage_notes');
        if (savedNotes) {
            try {
                setNotes(JSON.parse(savedNotes));
            } catch (e) {
                console.error("Failed to parse saved notes", e);
            }
        }
    }, []);

    // Listen for feed data from extension
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            if (event.data?.type === 'NARRATIVEE_ENGAGEMENT_FEED_LOADED') {
                console.log('🎯 Engage: Received', event.data.notes?.length, 'notes from extension');
                const loadedNotes = event.data.notes || [];
                setNotes(loadedNotes);
                localStorage.setItem('narrativee_engage_notes', JSON.stringify(loadedNotes));
                setIsLoading(false);
                setError(null);
            }

            if (event.data?.type === 'NARRATIVEE_COMMENT_POSTED') {
                console.log('🎯 Engage: Comment posted result:', event.data);
                if (event.data.success) {
                    setCommentedCount(prev => prev + 1);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handlePullFeed = () => {
        setIsLoading(true);
        setError(null);
        window.postMessage({ type: 'NARRATIVEE_PULL_ENGAGEMENT_FEED' }, '*');

        // Timeout
        setTimeout(() => {
            setIsLoading(prev => {
                if (prev) {
                    setError("Feed scrape timed out. Make sure the extension is installed and reload it.");
                    return false;
                }
                return prev;
            });
        }, 60000);
    };

    const handleGenerateComment = async (note: EngagementNote): Promise<string> => {
        const context = {
            rules: [],
            connectedSources: {
                publicationName: onboardingData.substackPublicationName,
                bio: onboardingData.substackBio,
            },
            platformPreferences: {
                language: onboardingData.language,
                writingStyle: onboardingData.writingStyle,
            },
        };

        return await generateEngagementComment({
            noteContent: note.content,
            authorName: note.author.name,
            authorHandle: note.author.handle,
            userBio: onboardingData.substackBio,
            writingStyle: onboardingData.writingStyle,
            language: onboardingData.language,
        }, context);
    };

    const handlePostComment = (noteUrl: string, comment: string) => {
        window.postMessage({
            type: 'NARRATIVEE_POST_COMMENT',
            noteUrl,
            comment,
            autoPost: true
        }, '*');
    };

    // Sort notes
    const sortedNotes = [...notes].sort((a, b) => {
        if (sortMode === "engagement") return b.totalEngagement - a.totalEngagement;
        if (sortMode === "comments") return b.engagement.comments - a.engagement.comments;
        return 0; // recent = default order from scrape
    });

    // Filter out user's own notes
    const filteredNotes = sortedNotes.filter(n => {
        const userHandle = onboardingData.substackHandle || onboardingData.substackProfileUrl?.split('@').pop()?.split('/')[0];
        if (userHandle && n.author.handle === userHandle) return false;
        return true;
    });

    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-light text-gray-100 flex items-center gap-3">
                            Engagement Autopilot
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Comment on trending notes to grow your visibility
                        </p>
                    </div>

                    {commentedCount > 0 && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
                            <span className="text-green-400 text-sm font-medium">{commentedCount} comments posted</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={handlePullFeed}
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Pulling feed...
                            </>
                        ) : (
                            <>
                                <Rss className="w-4 h-4" />
                                Pull Feed
                            </>
                        )}
                    </button>

                    {notes.length > 0 && (
                        <div className="flex items-center gap-1 bg-primary/10 rounded-lg border border-gray-700/50 p-1">
                            <button
                                onClick={() => setSortMode("engagement")}
                                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${sortMode === "engagement" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
                                    }`}
                            >
                                <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                                Top
                            </button>
                            <button
                                onClick={() => setSortMode("comments")}
                                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${sortMode === "comments" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
                                    }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                                Most Discussed
                            </button>
                            <button
                                onClick={() => setSortMode("recent")}
                                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${sortMode === "recent" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
                                    }`}
                            >
                                <Filter className="w-3.5 h-3.5 inline mr-1" />
                                Recent
                            </button>
                        </div>
                    )}

                    {notes.length > 0 && (
                        <span className="text-gray-500 text-sm ml-auto">
                            {filteredNotes.length} notes
                        </span>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && notes.length === 0 && !error && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-[#1e1f21] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-gray-300 font-medium mb-2">No notes yet</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">
                            Click &quot;Pull Feed&quot; to scrape trending notes from your Substack feed. Then generate AI comments and post them to boost your visibility.
                        </p>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-400 text-sm">Scraping your Substack feed...</p>
                        <p className="text-gray-500 text-xs mt-1">This may take 20-30 seconds</p>
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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
