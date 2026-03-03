"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Calendar, Loader2, Plus, Trash2, Check, Clock, FileText, Rss } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";
import PrimaryButton from "@/app/components/commons/PrimaryButton";
import { generateBulkNotes, fetchSubstackPosts } from "@/app/actions/agent";

interface NotesGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScheduleNotes?: (notes: GeneratedNote[]) => void;
}

interface OnboardingData {
    substackPublicationName?: string;
    substackPublicationUrl?: string;
    substackProfileUrl?: string;
    substackHandle?: string;
    substackBio?: string;
    writingStyle?: string;
    language?: string;
    contentTopics?: string;
}

interface GeneratedNote {
    id: string;
    content: string;
    scheduledDate?: string;
    scheduledTime?: string;
    selected: boolean;
}

interface SubstackPost {
    title: string;
    excerpt: string;
    content?: string;
    publishedAt?: string;
    url?: string;
    type?: 'post' | 'note';
}

type SourceMode = "feed" | "article";

const TONE_OPTIONS = [
    { value: "casual", label: "Casual & Friendly" },
    { value: "professional", label: "Professional" },
    { value: "witty", label: "Witty & Clever" },
    { value: "inspirational", label: "Inspirational" },
    { value: "direct", label: "Direct & Concise" },
];

export default function NotesGeneratorModal({ isOpen, onClose, onScheduleNotes }: NotesGeneratorModalProps) {
    const { data: session } = authClient.useSession();

    // Onboarding context
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
    const [isLoadingContext, setIsLoadingContext] = useState(true);

    // Custom rules from localStorage
    const [rules, setRules] = useState<string[]>([]);

    // Source mode
    const [sourceMode, setSourceMode] = useState<SourceMode>("feed");
    const [allPosts, setAllPosts] = useState<SubstackPost[]>([]);
    const [selectedArticleIndex, setSelectedArticleIndex] = useState<number | null>(null);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [clicked, setClicked] = useState(false);
    // Generation form
    const [topic, setTopic] = useState("");
    const [quantity, setQuantity] = useState(3);
    const [tone, setTone] = useState("casual");
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Sync state
    const [isSyncingNotes, setIsSyncingNotes] = useState(false);

    // Fetch onboarding data, rules, and all posts
    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) return;

            // Load rules from localStorage
            const savedRules = localStorage.getItem("narrativee_agent_rules");
            if (savedRules) {
                try {
                    const parsed = JSON.parse(savedRules);
                    setRules(parsed.map((r: any) => r.content));
                } catch (e) { }
            }

            try {
                const res = await fetch(`${API_URL}/onboarding`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setOnboardingData(data);
                    if (data.writingStyle) {
                        setTone(data.writingStyle);
                    }

                    // Fetch ALL posts from Substack
                    if (data.substackPublicationUrl) {
                        setIsLoadingPosts(true);
                        try {
                            const posts = await fetchSubstackPosts(data.substackPublicationUrl, 100); // Get all posts
                            setAllPosts(posts);
                        } catch (e) {
                            console.error("Failed to fetch posts:", e);
                        } finally {
                            setIsLoadingPosts(false);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch onboarding:", e);
            } finally {
                setIsLoadingContext(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [session, isOpen]);

    // Separate useEffect for message listener to capture current onboardingData
    useEffect(() => {
        if (!isOpen) return;
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NARRATIVEE_NOTES_SYNCED') {
                console.log("Received synced notes:", event.data.notes);
                const notes = event.data.notes;

                // Extract handle - assuming URL format like https://substack.com/@handle
                const userHandle = onboardingData.substackProfileUrl
                    ? onboardingData.substackProfileUrl.split('/').pop()?.split('?')[0].replace('@', '')
                    : null;

                console.log("Using handle for filtering:", userHandle);

                // Map to SubstackPost format and FILTER
                const newPosts: SubstackPost[] = notes
                    .filter((n: any) => {
                        // 1. Content check
                        if (!n.content) return false;

                        // 2. Handle check (if we have one)
                        // Note URL format: .../@handle/note/...
                        if (userHandle && n.url) {
                            if (!n.url.includes(`@${userHandle}`)) {
                                console.log("Filtering out Restack:", n.url);
                                return false;
                            }
                        }

                        // 3. Explicit Restack text check
                        if (n.content.includes("Restack") && n.content.length < 50) return false;

                        return true;
                    })
                    .map((n: any) => ({
                        title: `Note from ${new Date(n.date).toLocaleDateString()}`,
                        excerpt: n.content.substring(0, 150) + "...",
                        content: n.content,
                        publishedAt: n.date,
                        url: n.url,
                        type: 'note'
                    }));

                console.log("Keeping", newPosts.length, "original notes");

                setAllPosts(prev => {
                    // Filter out duplicates based on content or URL
                    const existingContent = new Set(prev.map(p => p.content));
                    const uniqueNew = newPosts.filter(p => !existingContent.has(p.content));
                    return [...uniqueNew, ...prev];
                });

                setError("");
                setIsSyncingNotes(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, onboardingData]);

    const handleSyncNotes = () => {
        if (!onboardingData.substackProfileUrl) {
            setError("Profile URL not found. Please update your onboarding settings.");
            return;
        }

        setIsSyncingNotes(true);
        setError(null);
        // Trigger sync via extension
        window.postMessage({
            type: 'NARRATIVEE_START_SYNC',
            profileUrl: onboardingData.substackProfileUrl
        }, '*');

        // Timeout fallback (45s - sync opens a new tab, scrolls, scrapes)
        setTimeout(() => {
            setIsSyncingNotes(prev => {
                if (prev) {
                    setError("Sync timed out. Make sure the extension is installed.");
                    return false;
                }
                return prev;
            });
        }, 45000);
    };

    const handleGenerate = async () => {
        if (sourceMode === "feed" && !topic.trim()) return;
        if (sourceMode === "article" && selectedArticleIndex === null) {
            setError("Please select an article first.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Determine sample posts based on source mode
            let samplePosts: Array<{ title: string; content?: string }> = [];

            if (sourceMode === "feed") {
                // Use ALL posts for voice training
                samplePosts = allPosts.map(p => ({ title: p.title, content: p.content }));
            } else if (sourceMode === "article" && selectedArticleIndex !== null) {
                // Use only the selected article
                const selectedPost = allPosts[selectedArticleIndex];
                if (selectedPost) {
                    samplePosts = [{ title: selectedPost.title, content: selectedPost.content }];
                }
            }

            // Build context from onboarding data
            const context = {
                userName: session?.user?.name,
                rules,
                connectedSources: {
                    publicationName: onboardingData.substackPublicationName,
                    publicationUrl: onboardingData.substackPublicationUrl,
                    profileUrl: onboardingData.substackProfileUrl,
                    bio: onboardingData.substackBio,
                },
                platformPreferences: {
                    language: onboardingData.language,
                    writingStyle: onboardingData.writingStyle,
                },
            };

            const bulkNotes = await generateBulkNotes(
                { topic, quantity, tone, scheduleStartDate: startDate, samplePosts },
                context
            );

            // Map to GeneratedNote format with dates
            const notes: GeneratedNote[] = bulkNotes.map((note, i) => {
                const noteDate = new Date(startDate);
                noteDate.setDate(noteDate.getDate() + i);

                return {
                    id: crypto.randomUUID(),
                    content: note.content,
                    scheduledDate: noteDate.toISOString().split('T')[0],
                    scheduledTime: note.suggestedTime || "09:00",
                    selected: true,
                };
            });

            setGeneratedNotes(notes);
        } catch (e) {
            console.error("Generation error:", e);
            setError("Failed to generate notes. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggleNote = (id: string) => {
        setGeneratedNotes(notes =>
            notes.map(n => n.id === id ? { ...n, selected: !n.selected } : n)
        );
    };

    const handleDeleteNote = (id: string) => {
        setGeneratedNotes(notes => notes.filter(n => n.id !== id));
    };

    const handleEditNote = (id: string, content: string) => {
        setGeneratedNotes(notes =>
            notes.map(n => n.id === id ? { ...n, content } : n)
        );
    };

    const handleDateChange = (id: string, date: string) => {
        setGeneratedNotes(notes =>
            notes.map(n => n.id === id ? { ...n, scheduledDate: date } : n)
        );
    };

    const handleTimeChange = (id: string, time: string) => {
        setGeneratedNotes(notes =>
            notes.map(n => n.id === id ? { ...n, scheduledTime: time } : n)
        );
    };

    const handleScheduleAll = () => {
        const selectedNotes = generatedNotes.filter(n => n.selected);

        // Save to localStorage in DailyScheduler format
        const existingPosts = JSON.parse(localStorage.getItem("narrativee_scheduler_posts_v3") || "[]");

        const newPosts = selectedNotes.map(note => ({
            id: note.id,
            content: note.content,
            time: note.scheduledTime,
            status: note.scheduledTime ? "scheduled" : "draft",
            date: note.scheduledDate,
        }));

        localStorage.setItem(
            "narrativee_scheduler_posts_v3",
            JSON.stringify([...existingPosts, ...newPosts])
        );

        onScheduleNotes?.(selectedNotes);
        onClose();

        // Force page refresh to show new posts
        window.location.reload();
    };

    const selectedCount = generatedNotes.filter(n => n.selected).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e1f21] rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="font-manrope text-xl text-gray-100">Notes Generations</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 p-1 hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Context Banner */}
                    {isLoadingContext ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading your profile...
                        </div>
                    ) : onboardingData.substackPublicationName && (
                        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 text-sm">
                            <p className="text-blue-300">
                                ✦ Generating for <strong>{onboardingData.substackPublicationName}</strong>
                                {onboardingData.writingStyle && ` • ${onboardingData.writingStyle} style`}
                            </p>
                        </div>
                    )}

                    {/* Generation Form */}
                    {generatedNotes.length === 0 ? (
                        <div className="space-y-4">
                            {/* Source Mode Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Training Source
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSourceMode("feed");
                                            console.log("🔍 [Debug] Current Posts/Notes:", allPosts);
                                            console.log("📝 Notes specific:", allPosts.filter(p => p.type === 'note'));
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${sourceMode === "feed"
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-[#2a2b2d] border-gray-600 text-gray-400 hover:border-gray-500"
                                            }`}
                                    >
                                        <Rss className="w-4 h-4" />
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="text-sm">Entire Feed</span>

                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setSourceMode("article")}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${sourceMode === "article"
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-[#2a2b2d] border-gray-600 text-gray-400 hover:border-gray-500"
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm">Specific Article</span>
                                    </button>
                                </div>
                                {isLoadingPosts && (
                                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-2">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Loading your posts...
                                    </div>
                                )}

                                {/* Sync Notes Button */}
                                <button
                                    onClick={handleSyncNotes}
                                    disabled={isSyncingNotes}
                                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#252627] hover:bg-[#2f3032] border border-gray-700 rounded-lg text-xs text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSyncingNotes ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                                            Syncing notes from your profile...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3 h-3 text-purple-400" />
                                            Sync Recent Notes from Profile
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Article Selector (when article mode) */}
                            {sourceMode === "article" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Select Article
                                    </label>
                                    {allPosts.length > 0 ? (
                                        <select
                                            value={selectedArticleIndex ?? ""}
                                            onChange={(e) => setSelectedArticleIndex(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full p-2.5 bg-[#2a2b2d] border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="">Choose an article...</option>
                                            {allPosts.map((post, idx) => (
                                                <option key={idx} value={idx}>
                                                    {post.title}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No articles found in your feed.</p>
                                    )}
                                    {selectedArticleIndex !== null && allPosts[selectedArticleIndex] && (
                                        <div className="mt-2 p-3 bg-[#252627] rounded-lg border border-gray-700">
                                            <p className="text-xs text-gray-400 line-clamp-3">
                                                {allPosts[selectedArticleIndex].excerpt}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Topic Input — only show for feed mode */}
                            {sourceMode === "feed" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Topic or Prompt
                                    </label>
                                    <textarea
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Productivity tips for writers, Hot takes on AI in creative industries..."
                                        className="w-full p-3 rounded-lg border text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                                        rows={3}
                                    />
                                </div>
                            )}

                            <p className="text-sm font-medium text-gray-300 mb-2 cursor-pointer"
                                onClick={() => setClicked(!clicked)}
                            >More options</p>
                            {/* Options Grid */}
                            {clicked && (
                                <div className="grid grid-cols-3 gap-4"
                                >
                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Quantity
                                        </label>
                                        <select
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-full p-2.5 bg-[#2a2b2d] border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
                                        >
                                            {[1, 2, 3, 5, 7, 10].map(n => (
                                                <option key={n} value={n}>{n} note{n > 1 ? 's' : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tone
                                        </label>
                                        <select
                                            value={tone}
                                            onChange={(e) => setTone(e.target.value)}
                                            className="w-full p-2.5 bg-[#2a2b2d] border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
                                        >
                                            {TONE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-2.5 bg-[#2a2b2d] border border-gray-600 rounded-lg text-gray-200 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="text-red-400 text-sm">{error}</p>
                            )}

                            {/* Generate Button */}
                            <PrimaryButton
                                onClick={handleGenerate}
                                disabled={(sourceMode === "feed" && !topic.trim()) || (sourceMode === "article" && selectedArticleIndex === null) || isGenerating}
                                className="w-full py-3"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Generating {quantity} notes...
                                    </>
                                ) : (
                                    <>
                                        Generate {quantity} Notes
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    ) : (
                        /* Generated Notes List */
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-gray-200 font-medium">
                                    Generated Notes ({selectedCount} selected)
                                </h4>
                                <button
                                    onClick={() => setGeneratedNotes([])}
                                    className="text-sm text-gray-400 hover:text-gray-200"
                                >
                                    ← Generate new
                                </button>
                            </div>

                            <div className="space-y-3">
                                {generatedNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={`bg-[#2a2b2d] rounded-lg p-4 transition-all ${note.selected ? 'border-blue-300' : 'border-gray-600 opacity-60'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleNote(note.id)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${note.selected
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-gray-500 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {note.selected && <Check className="w-3 h-3 text-white" />}
                                                </button>
                                                <span className="text-xs  w-fit">
                                                    <input
                                                        type="date"
                                                        value={note.scheduledDate}
                                                        onChange={(e) => handleDateChange(note.id, e.target.value)}
                                                        className="bg-transparent border-none p-0 text-xs text-gray-400 focus:ring-0 focus:text-gray-200 cursor-pointer text-white"
                                                    />
                                                    <input
                                                        type="time"

































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































                                                        value={note.scheduledTime}
                                                        onChange={(e) => handleTimeChange(note.id, e.target.value)}
                                                        className="bg-transparent border-none p-0 text-xs text-gray-400 focus:ring-0 focus:text-gray-200 cursor-pointer text-white"
                                                    />
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="text-gray-500 hover:text-red-400 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <textarea
                                            value={note.content}
                                            onChange={(e) => handleEditNote(note.id, e.target.value)}
                                            className="w-full bg-transparent text-gray-200 text-sm resize-none focus:outline-none"
                                            rows={3}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {generatedNotes.length > 0 && (
                    <div className="p-4 border-t border-gray-700 bg-[#1a1b1c] flex justify-between items-center">
                        <p className="text-sm text-gray-400">
                            {selectedCount} note{selectedCount !== 1 ? 's' : ''} will be scheduled
                        </p>
                        <PrimaryButton
                            onClick={handleScheduleAll}
                            disabled={selectedCount === 0}
                        >
                            Schedule {selectedCount} Notes
                        </PrimaryButton>
                    </div>
                )}
            </div>
        </div>
    );
}
