"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Trash2, Check, Clock, FileText, Rss, ChevronDown, ChevronUp } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";
import { generateBulkNotes, fetchSubstackPosts } from "@/app/actions/agent";
import { useSideBarStore } from "@/app/state/SideBar.store";

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
    { value: "casual", label: "Casual" },
    { value: "professional", label: "Professional" },
    { value: "witty", label: "Witty" },
    { value: "inspirational", label: "Inspirational" },
    { value: "direct", label: "Direct" },
];

export default function NotesGeneratorModal({ isOpen, onClose, onScheduleNotes }: NotesGeneratorModalProps) {
    const { data: session } = authClient.useSession();

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
    const [isLoadingContext, setIsLoadingContext] = useState(true);
    const [rules, setRules] = useState<string[]>([]);
    const [sourceMode, setSourceMode] = useState<SourceMode>("feed");
    const [articles, setArticles] = useState<SubstackPost[]>([]);
    const [syncedNotes, setSyncedNotes] = useState<SubstackPost[]>([]);
    const [allPosts, setAllPosts] = useState<SubstackPost[]>([]);
    const [selectedArticleIndex, setSelectedArticleIndex] = useState<number | null>(null);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [topic, setTopic] = useState("");
    const [quantity, setQuantity] = useState(3);
    const [tone, setTone] = useState("casual");
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSyncingNotes, setIsSyncingNotes] = useState(false);
    const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            if (!session?.user) return;
            const savedRules = localStorage.getItem("narrativee_agent_rules");
            if (savedRules) {
                try { setRules(JSON.parse(savedRules).map((r: any) => r.content)); } catch (e) { }
            }
            try {
                const res = await fetch(`${API_URL}/onboarding`, { credentials: 'include' });
                if (res.ok) {
                    const data: any = await res.json();
                    setOnboardingData(data);
                    if (data.writingStyle) setTone(data.writingStyle);
                    if (data.substackPublicationUrl) {
                        setIsLoadingPosts(true);
                        try {
                            const posts = await fetchSubstackPosts(data.substackPublicationUrl, 100);
                            setArticles(posts);
                            setAllPosts(posts);
                        } catch (e) { console.error("Failed to fetch posts:", e); }
                        finally { setIsLoadingPosts(false); }
                    }
                }
            } catch (e) { console.error("Failed to fetch onboarding:", e); }
            finally { setIsLoadingContext(false); }
        };
        fetchData();
    }, [session, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NARRATIVEE_NOTES_SYNCED') {
                const notes: unknown[] = event.data.notes;
                const newPosts: SubstackPost[] = notes
                    .filter((n) => {
                        const note = n as Record<string, unknown>;
                        const body = (note.content || note.contentPreview || '') as string;
                        if (!body) return false;
                        if (body.includes("Restack") && body.length < 50) return false;
                        return true;
                    })
                    .map((n) => {
                        const note = n as Record<string, unknown>;
                        const body = (note.content || note.contentPreview || '') as string;
                        const date = (note.date || note.publishedAt || '') as string;
                        return {
                            title: `Note from ${date ? new Date(date).toLocaleDateString() : 'unknown date'}`,
                            excerpt: body.substring(0, 150) + "...",
                            content: body, publishedAt: date, url: note.url as string | undefined, type: 'note' as const,
                        };
                    });
                setSyncedNotes(prev => {
                    const existingContent = new Set(prev.map(p => p.content));
                    return [...newPosts.filter(p => !existingContent.has(p.content)), ...prev];
                });
                setAllPosts(prev => {
                    const existingContent = new Set(prev.map(p => p.content));
                    return [...newPosts.filter(p => !existingContent.has(p.content)), ...prev];
                });
                setLastSyncCount(newPosts.length);
                setError(null);
                setIsSyncingNotes(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, onboardingData]);

    const handleSyncNotes = () => {
        if (!onboardingData.substackProfileUrl) { setError("Profile URL not found."); return; }
        setIsSyncingNotes(true);
        setError(null);
        window.postMessage({ type: 'NARRATIVEE_START_SYNC', profileUrl: onboardingData.substackProfileUrl }, '*');
        setTimeout(() => {
            setIsSyncingNotes(prev => { if (prev) { setError("Sync timed out. Make sure the extension is installed."); return false; } return prev; });
        }, 120000);
    };

    const handleGenerate = async () => {
        if (sourceMode === "article" && selectedArticleIndex === null) { setError("Please select an article first."); return; }

        const currentCredits = useSideBarStore.getState().credits;
        if (currentCredits !== null && currentCredits < quantity) {
            setError(`Need ${quantity} credits. You have ${currentCredits}.`);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const deductRes = await fetch(`${API_URL}/user/credits/deduct`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: quantity }), credentials: 'include'
            });
            const deductData = await deductRes.json() as any;
            if (!deductData.success) { setError(deductData.error || "Failed to deduct credits"); setIsGenerating(false); return; }
            useSideBarStore.getState().setCredits(deductData.credits);
        } catch (e: any) { setError(e.message || "Failed to process credits"); setIsGenerating(false); return; }

        try {
            let samplePosts: Array<{ title: string; content?: string }> = [];
            if (sourceMode === "feed") {
                samplePosts = allPosts.map(p => ({ title: p.title, content: p.content }));
            } else if (selectedArticleIndex !== null && articles[selectedArticleIndex]) {
                samplePosts = [{ title: articles[selectedArticleIndex]!.title, content: articles[selectedArticleIndex]!.content }];
            }

            const context = {
                userName: session?.user?.name, rules,
                connectedSources: { publicationName: onboardingData.substackPublicationName, publicationUrl: onboardingData.substackPublicationUrl, profileUrl: onboardingData.substackProfileUrl, bio: onboardingData.substackBio },
                platformPreferences: { language: onboardingData.language, writingStyle: onboardingData.writingStyle },
            };

            const bulkNotes = await generateBulkNotes({ topic, quantity, tone, scheduleStartDate: startDate, samplePosts }, context);
            const notes: GeneratedNote[] = bulkNotes.map((note, i) => {
                const noteDate = new Date(startDate || new Date());
                noteDate.setDate(noteDate.getDate() + i);
                return { id: crypto.randomUUID(), content: note.content, scheduledDate: noteDate.toISOString().split('T')[0], scheduledTime: note.suggestedTime || "09:00", selected: true };
            });
            setGeneratedNotes(notes);
        } catch (e) {
            console.error("Generation error:", e);
            setError("Failed to generate notes. Please try again.");
        } finally { setIsGenerating(false); }
    };

    const handleScheduleAll = async () => {
        const selectedNotes = generatedNotes.filter(n => n.selected);
        setIsGenerating(true);
        try {
            await Promise.all(selectedNotes.map(async (note) => {
                const status = note.scheduledTime ? "scheduled" : "draft";
                await fetch(`${API_URL}/scheduled-notes`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                    body: JSON.stringify({ id: note.id, content: note.content, scheduledDate: note.scheduledDate, scheduledTime: note.scheduledTime || null, status }),
                });
                if (status === "scheduled" && typeof window !== 'undefined') {
                    const [hours, minutes] = (note.scheduledTime || "09:00").split(':').map(Number);
                    const scheduledDateObj = new Date(note.scheduledDate || new Date());
                    scheduledDateObj.setHours(hours ?? 0, minutes ?? 0, 0, 0);
                    window.postMessage({ type: 'NARRATIVEE_SCHEDULE_POST', payload: { postId: note.id, content: note.content, scheduledTimestamp: scheduledDateObj.getTime() } }, "*");
                }
            }));
            onScheduleNotes?.(selectedNotes);
            onClose();
            window.location.reload();
        } catch (error) {
            console.error("Failed to schedule:", error);
            setError("Failed to save notes.");
        } finally { setIsGenerating(false); }
    };

    const selectedCount = generatedNotes.filter(n => n.selected).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#141415] border border-white/[0.06] rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-100">Generate Notes</h3>
                            {onboardingData.substackPublicationName && !isLoadingContext && (
                                <p className="text-[11px] text-gray-500">for {onboardingData.substackPublicationName}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {generatedNotes.length === 0 ? (
                        <>
                            {/* Source Mode */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Training Source</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setSourceMode("feed")}
                                        className={`flex items-center gap-2.5 p-3.5 rounded-xl border transition-all ${sourceMode === "feed" ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/10 hover:text-gray-300"}`}
                                    >
                                        <Rss className="w-4 h-4 shrink-0" />
                                        <div className="text-left">
                                            <div className="text-xs font-semibold">Entire Feed</div>
                                            <div className="text-[10px] opacity-70">
                                                {syncedNotes.length > 0 && <span>{syncedNotes.length} notes</span>}
                                                {articles.length === 0 && syncedNotes.length === 0 && <span>No content loaded</span>}
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setSourceMode("article")}
                                        className={`flex items-center gap-2.5 p-3.5 rounded-xl border transition-all ${sourceMode === "article" ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/10 hover:text-gray-300"}`}
                                    >
                                        <FileText className="w-4 h-4 shrink-0" />
                                        <div className="text-left">
                                            <div className="text-xs font-semibold">Specific Article</div>
                                            <div className="text-[10px] opacity-70">{articles.length} articles available</div>
                                        </div>
                                    </button>
                                </div>

                                {/* Sync notes button */}
                                <button
                                    onClick={handleSyncNotes}
                                    disabled={isSyncingNotes}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-all disabled:opacity-50"
                                >
                                    {isSyncingNotes
                                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing your notes...</>
                                        : lastSyncCount !== null
                                            ? <><Sparkles className="w-3 h-3 text-primary" /> {lastSyncCount} new notes synced — sync again</>
                                            : syncedNotes.length > 0
                                                ? <><Sparkles className="w-3 h-3 text-primary" /> {syncedNotes.length} notes synced — sync again</>
                                                : <><Sparkles className="w-3 h-3 text-primary" /> Sync your notes for better voice matching</>
                                    }
                                </button>
                                <p className="text-[10px] text-gray-600 -mt-2 px-1">
                                    Articles = your published posts (loaded automatically). Notes = your short-form Substack notes (requires extension sync).
                                </p>
                            </div>

                            {/* Article selector */}
                            {sourceMode === "article" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Select Article</label>
                                    {isLoadingPosts ? (
                                        <div className="flex items-center gap-2 text-gray-500 text-xs py-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading articles...</div>
                                    ) : articles.length > 0 ? (
                                        <select
                                            value={selectedArticleIndex ?? ""}
                                            onChange={(e) => setSelectedArticleIndex(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-gray-300 text-sm focus:border-primary/50 focus:outline-none"
                                        >
                                            <option value="">Choose an article...</option>
                                            {articles.map((post, idx) => <option key={idx} value={idx}>{post.title}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-gray-600 text-xs">No articles found.</p>
                                    )}
                                    {selectedArticleIndex !== null && articles[selectedArticleIndex] && (
                                        <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                            <p className="text-xs text-gray-500 line-clamp-2">{articles[selectedArticleIndex]!.excerpt}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Topic */}
                            {sourceMode === "feed" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Topic or Prompt <span className="normal-case text-gray-600">(optional)</span></label>
                                    <textarea
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Productivity tips for writers... (optional)"
                                        className="w-full px-3.5 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:border-primary/50 focus:outline-none resize-none"
                                        rows={3}
                                    />
                                </div>
                            )}

                            {/* More Options toggle */}
                            <button
                                onClick={() => setShowOptions(!showOptions)}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {showOptions ? "Fewer options" : "More options"}
                            </button>

                            {showOptions && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Quantity</label>
                                        <select
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-full px-2.5 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-300 text-xs focus:border-primary/50 focus:outline-none"
                                        >
                                            {[1, 2, 3, 5, 7, 10].map(n => <option key={n} value={n}>{n} note{n > 1 ? 's' : ''}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Tone</label>
                                        <select
                                            value={tone}
                                            onChange={(e) => setTone(e.target.value)}
                                            className="w-full px-2.5 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-300 text-xs focus:border-primary/50 focus:outline-none"
                                        >
                                            {TONE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-2.5 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-300 text-xs focus:border-primary/50 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-red-400 text-xs bg-red-900/10 border border-red-800/20 rounded-lg px-3 py-2">{error}</p>}

                            <button
                                onClick={handleGenerate}
                                disabled={(sourceMode === "article" && selectedArticleIndex === null) || isGenerating}
                                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating {quantity} notes...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Generate {quantity} Note{quantity !== 1 ? 's' : ''}</>
                                )}
                            </button>
                        </>
                    ) : (
                        /* Generated Notes */
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-400">{selectedCount} of {generatedNotes.length} selected</span>
                                <button onClick={() => setGeneratedNotes([])} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                                    ← Generate new
                                </button>
                            </div>

                            <div className="space-y-3">
                                {generatedNotes.map((note) => (
                                    <div key={note.id} className={`rounded-xl border transition-all ${note.selected ? 'bg-[#1a1b1d] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-50'}`}>
                                        <div className="px-4 pt-4 pb-3">
                                            <div className="flex items-center gap-2 mb-3">
                                                <button
                                                    onClick={() => setGeneratedNotes(notes => notes.map(n => n.id === note.id ? { ...n, selected: !n.selected } : n))}
                                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${note.selected ? 'bg-primary border-primary' : 'border-white/20 hover:border-white/30'}`}
                                                >
                                                    {note.selected && <Check className="w-2.5 h-2.5 text-white" />}
                                                </button>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Clock className="w-3 h-3 text-gray-600" />
                                                    <input
                                                        type="date"
                                                        value={note.scheduledDate}
                                                        onChange={(e) => setGeneratedNotes(notes => notes.map(n => n.id === note.id ? { ...n, scheduledDate: e.target.value } : n))}
                                                        className="bg-transparent text-[11px] text-gray-500 focus:outline-none focus:text-gray-300 cursor-pointer"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={note.scheduledTime}
                                                        onChange={(e) => setGeneratedNotes(notes => notes.map(n => n.id === note.id ? { ...n, scheduledTime: e.target.value } : n))}
                                                        className="bg-transparent text-[11px] text-gray-500 focus:outline-none focus:text-gray-300 cursor-pointer"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setGeneratedNotes(notes => notes.filter(n => n.id !== note.id))}
                                                    className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={note.content}
                                                onChange={(e) => setGeneratedNotes(notes => notes.map(n => n.id === note.id ? { ...n, content: e.target.value } : n))}
                                                className="w-full bg-transparent text-sm text-gray-300 resize-none focus:outline-none leading-relaxed"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && <p className="text-red-400 text-xs bg-red-900/10 border border-red-800/20 rounded-lg px-3 py-2">{error}</p>}
                        </>
                    )}
                </div>

                {/* Footer */}
                {generatedNotes.length > 0 && (
                    <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">{selectedCount} note{selectedCount !== 1 ? 's' : ''} will be scheduled</p>
                        <button
                            onClick={handleScheduleAll}
                            disabled={selectedCount === 0 || isGenerating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all"
                        >
                            {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <>Schedule {selectedCount} Notes</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
