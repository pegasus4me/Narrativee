"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Play, Pause, Trash2, Users, MessageSquare, Target, ChevronRight, ArrowLeft, Check, X, SkipForward, Loader2, Rss, Heart, Repeat2, ExternalLink, TrendingUp, Clock, Search } from "lucide-react";
import { BsPatchCheckFill } from "react-icons/bs";
import { API_URL } from "@/lib/api-config";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
// ── Types ──────────────────────────────────────────────────────────────────────

interface Campaign {
    id: string;
    name: string;
    status: "draft" | "active" | "paused" | "completed";
    replyTemplate: string;
    sequenceSteps: string[];
    dailyQuota: number;
    repliedToday: number;
    totalReplies: number;
    createdAt: string;
    targets?: CampaignTarget[];
}

interface CampaignTarget {
    id: string;
    targetAuthorName: string | null;
    targetAuthorHandle: string | null;
    targetCommentContent: string | null;
    parentCommentContent: string | null;
    originalNoteContent: string | null;
    parentPostUrl: string;
    parentCommentUrl: string;
    targetCommentId: string;
    targetCommentUrl: string | null;
    status: "pending" | "replied" | "skipped" | "failed";
    sequenceStep: number;
    repliedAt: string | null;
    replyText: string | null;
    targetRepliedBack: boolean;
    targetSubscribed: boolean;
}

interface FeedNote {
    id: string;
    content: string;
    author: { name: string; handle: string; avatar: string };
    engagement: { likes: number; restacks: number; comments: number };
    totalEngagement: number;
    url: string;
    timestamp: string;
}

interface ScrapedTarget {
    parentCommentId: string;
    parentCommentUrl: string;
    parentPostUrl: string;
    parentCommentContent: string;
    targetAuthorName: string;
    targetAuthorHandle: string;
    targetCommentId: string;
    targetCommentContent: string;
    originalNoteContent: string;
}

type View = "list" | "detail" | "create";

// ── FeedNoteCard ───────────────────────────────────────────────────────────────

interface FeedNoteCardProps {
    note: FeedNote;
    onPullCommenters: (noteUrl: string) => void;
    isScrapingThisNote: boolean;
    scrapedTargets: ScrapedTarget[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
}

function FeedNoteCard({ note, onPullCommenters, isScrapingThisNote, scrapedTargets, selectedIds, onToggleSelect }: FeedNoteCardProps) {
    const hasTargets = scrapedTargets.length > 0;
    const selectedCount = scrapedTargets.filter(t => selectedIds.has(t.targetCommentId)).length;

    return (
        <div className="bg-[#1a1b1d] rounded-xl border border-white/[0.06] overflow-hidden">
            {/* Note header */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {note.author?.avatar ? (
                        <Image src={note.author.avatar!} alt={note.author?.name || "User"} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0">
                            {(note.author?.name || "U").charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-sm font-medium text-gray-200 truncate">{note.author?.name || "Unknown Author"}</span>
                            <BsPatchCheckFill className="w-3 h-3 text-primary shrink-0" />
                            {note.author?.handle && <span className="text-xs text-gray-500 truncate">@{note.author.handle}</span>}
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                            {note.content.length > 200 ? note.content.slice(0, 200) + "..." : note.content}
                        </p>
                    </div>
                    <a href={note.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors shrink-0">
                        <ExternalLink size={13} />
                    </a>
                </div>

                {/* Stats + Pull button */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                    <span className="flex items-center gap-1 text-xs text-gray-600"><Heart size={11} /> {note.engagement.likes}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-600"><Repeat2 size={11} /> {note.engagement.restacks}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-600"><MessageSquare size={11} /> {note.engagement.comments}</span>
                    <button
                        onClick={() => onPullCommenters(note.url)}
                        disabled={isScrapingThisNote || note.engagement.comments === 0}
                        className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isScrapingThisNote ? <Loader2 size={11} className="animate-spin" /> : <Users size={11} />}
                        {isScrapingThisNote ? "Scraping..." : note.engagement.comments === 0 ? "No comments" : "Pull commenters"}
                    </button>
                </div>
            </div>

            {/* Scraped targets for this note */}
            {isScrapingThisNote && (
                <div className="px-4 pb-4 flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 size={12} className="animate-spin text-primary" />
                    Opening post and scraping reply threads...
                </div>
            )}

            {hasTargets && (
                <div className="border-t border-white/[0.04] p-4 pt-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">{scrapedTargets.length} 2nd-degree commenters</span>
                        <div className="flex items-center gap-2 text-xs">
                            <button
                                onClick={() => scrapedTargets.forEach(t => !selectedIds.has(t.targetCommentId) && onToggleSelect(t.targetCommentId))}
                                className="text-gray-600 hover:text-gray-400 transition-colors"
                            >
                                All
                            </button>
                            <span className="text-gray-700">·</span>
                            <button
                                onClick={() => scrapedTargets.forEach(t => selectedIds.has(t.targetCommentId) && onToggleSelect(t.targetCommentId))}
                                className="text-gray-600 hover:text-gray-400 transition-colors"
                            >
                                None
                            </button>
                            {selectedCount > 0 && <span className="text-primary font-medium">{selectedCount} selected</span>}
                        </div>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {scrapedTargets.map(target => {
                            const isSelected = selectedIds.has(target.targetCommentId);
                            return (
                                <button
                                    key={target.targetCommentId}
                                    onClick={() => onToggleSelect(target.targetCommentId)}
                                    className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                                        isSelected ? "bg-primary/10 border-primary/30" : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                            isSelected ? "bg-primary border-primary" : "border-white/20"
                                        }`}>
                                            {isSelected && <Check size={9} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-gray-300">
                                                {target.targetAuthorName || target.targetAuthorHandle || "Unknown"}
                                            </span>
                                            {target.targetAuthorHandle && (
                                                <span className="text-xs text-gray-600 ml-1">@{target.targetAuthorHandle}</span>
                                            )}
                                            {target.targetCommentContent && (
                                                <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">&ldquo;{target.targetCommentContent}&rdquo;</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

function CampaignsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    // Derive view from URL
    const campaignId = searchParams.get("id");
    const view: View = campaignId === "new" ? "create" : campaignId ? "detail" : "list";
    const setView = (v: View) => {
        if (v === "list") router.push("/workspace/campaigns");
        else if (v === "create") router.push("/workspace/campaigns?id=new");
    };
    const [isLoading, setIsLoading] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [isAutoRunning, setIsAutoRunning] = useState(false);
    const [autoRunCount, setAutoRunCount] = useState(0);
    const [nextReplyCountdown, setNextReplyCountdown] = useState<number | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isAutoRunningRef = useRef(false);
    const handleFireNextReplyRef = useRef<(auto?: boolean) => Promise<void>>(async () => {});
    const [isAddingTargets, setIsAddingTargets] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = authClient.useSession();

    // Feed state (same as Engage)
    const [feedNotes, setFeedNotes] = useState<FeedNote[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(false);
    const [lastPulled, setLastPulled] = useState<Date | null>(null);
    const [minComments, setMinComments] = useState(30);

    // Keyword search state
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isKeywordSearching, setIsKeywordSearching] = useState(false);

    // Per-note scraping state: noteUrl → ScrapedTarget[]
    const [scrapingNoteUrl, setScrapingNoteUrl] = useState<string | null>(null);
    const [targetsByNote, setTargetsByNote] = useState<Record<string, ScrapedTarget[]>>({});

    // Global selection across all notes
    const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());

    // Create form state
    const [createForm, setCreateForm] = useState({ name: "", sequenceSteps: [""], dailyQuota: 5 });
    const [isEditingQuota, setIsEditingQuota] = useState(false);
    const [quotaDraft, setQuotaDraft] = useState(0);

    const handleSaveQuota = async () => {
        if (!selectedCampaign) return;
        const quota = Math.max(1, Math.min(200, quotaDraft));
        try {
            const res = await fetch(`${API_URL}/campaigns/${selectedCampaign.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dailyQuota: quota }),
            });
            if (res.ok) {
                setSelectedCampaign(c => c ? { ...c, dailyQuota: quota } : c);
                setCampaigns(cs => cs.map(c => c.id === selectedCampaign.id ? { ...c, dailyQuota: quota } : c));
            }
        } finally {
            setIsEditingQuota(false);
        }
    };

    const fetchCampaigns = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/campaigns`, { credentials: "include" });
            const data = await res.json() as { campaigns?: Campaign[] };
            setCampaigns((data.campaigns || []).filter((c): c is Campaign => !!c && typeof c.name === "string"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCampaign = useCallback(async (id: string) => {
        const res = await fetch(`${API_URL}/campaigns/${id}`, { credentials: "include" });
        const data = await res.json() as { campaign: Campaign };
        setSelectedCampaign(data.campaign);
    }, []);

    useEffect(() => {
        if (session?.user) fetchCampaigns();
    }, [session?.user, fetchCampaigns]);

    // If URL has ?id=xxx but we have no selectedCampaign yet (e.g. direct link / refresh), fetch it
    useEffect(() => {
        if (campaignId && campaignId !== "new" && !selectedCampaign && session?.user) {
            fetchCampaign(campaignId);
        }
    }, [campaignId, selectedCampaign, session?.user, fetchCampaign]);

    // Extension message listener
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Feed loaded
            if (event.data?.type === "NARRATIVEE_ENGAGEMENT_FEED_LOADED") {
                const notes: FeedNote[] = event.data.notes || [];
                setFeedNotes(notes);
                setLastPulled(new Date());
                setIsFeedLoading(false);
            }

            // Keyword search results
            if (event.data?.type === "NARRATIVEE_KEYWORD_SEARCH_RESULTS") {
                const notes: FeedNote[] = event.data.notes || [];
                setFeedNotes(notes);
                setLastPulled(new Date());
                setIsKeywordSearching(false);
                if (event.data.error) {
                    setError(`Search failed: ${event.data.error}`);
                } else if (notes.length === 0) {
                    setError("No notes found for that keyword.");
                }
            }

            // Targets scraped for a specific note
            if (event.data?.type === "NARRATIVEE_CAMPAIGN_TARGETS_SCRAPED") {
                const incoming: ScrapedTarget[] = event.data.targets || [];
                const postUrl = event.data.postUrl ?? incoming[0]?.parentPostUrl ?? scrapingNoteUrl ?? "";
                setScrapingNoteUrl(null);

                if (!incoming.length) {
                    setError("No 2nd-degree commenters found on that post.");
                    return;
                }

                setTargetsByNote(prev => {
                    const existing = prev[postUrl] || [];
                    const existingIds = new Set(existing.map(t => t.targetCommentId));
                    const fresh = incoming.filter(t => !existingIds.has(t.targetCommentId));
                    return { ...prev, [postUrl]: [...existing, ...fresh] };
                });
                // Auto-select new ones
                setSelectedTargetIds(prev => {
                    const next = new Set(prev);
                    incoming.forEach(t => next.add(t.targetCommentId));
                    return next;
                });
                setError(null);
            }

            // Reply done
            if (event.data?.type === "NARRATIVEE_CAMPAIGN_REPLY_DONE") {
                const { campaignId, targetId, success, replyCommentId, replyText, error: replyError } = event.data;
                setIsReplying(false);
                if (success) {
                    fetch(`${API_URL}/campaigns/${campaignId}/targets/${targetId}/replied`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ replyCommentId, replyText }),
                    }).then(() => fetchCampaign(campaignId));
                    setAutoRunCount(prev => prev + 1);
                    // If auto-run is active, fire the next reply after a human-paced delay
                    // 45–90s with jitter to avoid 429s and reduce shadowban risk
                    if (isAutoRunningRef.current) {
                        const delayMs = 45000 + Math.floor(Math.random() * 45000);
                        const delaySec = Math.round(delayMs / 1000);
                        console.log(`🎯 Campaign: Next reply in ${delaySec}s`);
                        setNextReplyCountdown(delaySec);
                        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = setInterval(() => {
                            setNextReplyCountdown(prev => {
                                if (prev === null || prev <= 1) {
                                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                                    return null;
                                }
                                return prev - 1;
                            });
                        }, 1000);
                        setTimeout(() => {
                            if (isAutoRunningRef.current) {
                                handleFireNextReplyRef.current(true);
                            }
                        }, delayMs);
                    }
                } else {
                    fetch(`${API_URL}/campaigns/${campaignId}/targets/${targetId}/skip`, {
                        method: "POST",
                        credentials: "include",
                    }).then(() => fetchCampaign(campaignId));
                    // On failure, stop auto-run to avoid cascading errors
                    if (isAutoRunningRef.current) {
                        isAutoRunningRef.current = false;
                        setIsAutoRunning(false);
                        setAutoRunCount(0);
                    }
                    setError(`Reply failed: ${replyError || "unknown error"}`);
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [fetchCampaign, scrapingNoteUrl]);

    const handlePullFeed = () => {
        setIsFeedLoading(true);
        setError(null);
        setFeedNotes([]);
        setTargetsByNote({});
        setSelectedTargetIds(new Set());
        window.postMessage({ type: "NARRATIVEE_PULL_ENGAGEMENT_FEED" }, "*");
        setTimeout(() => {
            setIsFeedLoading(p => { if (p) setError("Feed timed out. Make sure the extension is installed."); return false; });
        }, 60000);
    };

    const handleKeywordSearch = () => {
        if (!searchKeyword.trim()) return;
        setIsKeywordSearching(true);
        setError(null);
        setFeedNotes([]);
        setTargetsByNote({});
        setSelectedTargetIds(new Set());
        window.postMessage({ type: "NARRATIVEE_SEARCH_KEYWORD_NOTES", keyword: searchKeyword.trim() }, "*");
        setTimeout(() => {
            setIsKeywordSearching(p => { if (p) setError("Keyword search timed out. Make sure the extension is installed."); return false; });
        }, 90000);
    };

    const handleScrapeNote = (noteUrl: string) => {
        if (!selectedCampaign) return;
        setScrapingNoteUrl(noteUrl);
        setError(null);
        window.postMessage({
            type: "NARRATIVEE_SCRAPE_CAMPAIGN_TARGETS",
            campaignId: selectedCampaign.id,
            postUrl: noteUrl,
        }, "*");
        setTimeout(() => {
            setScrapingNoteUrl(p => { if (p === noteUrl) { setError("Timed out scraping that post."); return null; } return p; });
        }, 60000);
    };

    const toggleSelectTarget = (id: string) => {
        setSelectedTargetIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allScrapedTargets = Object.values(targetsByNote).flat();
    const totalSelected = allScrapedTargets.filter(t => selectedTargetIds.has(t.targetCommentId)).length;

    const handleAddSelected = async () => {
        if (!selectedCampaign || totalSelected === 0) return;
        setIsAddingTargets(true);
        const targets = allScrapedTargets.filter(t => selectedTargetIds.has(t.targetCommentId));
        try {
            await fetch(`${API_URL}/campaigns/${selectedCampaign.id}/targets`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targets }),
            });
            setTargetsByNote({});
            setSelectedTargetIds(new Set());
            await fetchCampaign(selectedCampaign.id);
        } catch {
            setError("Failed to add targets");
        } finally {
            setIsAddingTargets(false);
        }
    };

    const handleCreateCampaign = async () => {
        if (!createForm.name) return;
        try {
            const res = await fetch(`${API_URL}/campaigns`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });
            const data = await res.json() as { campaign: Campaign };
            setCampaigns(prev => [data.campaign, ...prev]);
            setCreateForm({ name: "", sequenceSteps: [""], dailyQuota: 5 });
            setView("list");
        } catch {
            setError("Failed to create campaign");
        }
    };

    const handleToggleStatus = async (campaign: Campaign) => {
        const newStatus = campaign.status === "active" ? "paused" : "active";
        const res = await fetch(`${API_URL}/campaigns/${campaign.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json() as { campaign: Campaign };
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? data.campaign : c));
        if (selectedCampaign?.id === campaign.id) setSelectedCampaign(data.campaign);
        // keep URL unchanged — we're already on the detail page
    };

    const handleClearTargets = async () => {
        if (!selectedCampaign) return;
        if (!confirm("Clear all targets? This cannot be undone.")) return;
        await fetch(`${API_URL}/campaigns/${selectedCampaign.id}/targets`, { method: "DELETE", credentials: "include" });
        await fetchCampaign(selectedCampaign.id);
    };

    const handleSkipAllPending = async () => {
        if (!selectedCampaign) return;
        const pendingTargets = selectedCampaign.targets?.filter(t => t.status === "pending") || [];
        if (pendingTargets.length === 0) return;
        if (!confirm(`Skip all ${pendingTargets.length} pending targets? They won't receive replies.`)) return;
        
        // Let the user know it's processing by setting a loading state if we want, or just await Promise.all
        // since Promise.all on 50 items takes barely any time to dispatch to the backend.
        await Promise.all(pendingTargets.map(t => 
            fetch(`${API_URL}/campaigns/${selectedCampaign.id}/targets/${t.id}/skip`, { method: "POST", credentials: "include" })
        ));
        await fetchCampaign(selectedCampaign.id);
    };

    const handleDelete = async (id: string) => {
        await fetch(`${API_URL}/campaigns/${id}`, { method: "DELETE", credentials: "include" });
        setCampaigns(prev => prev.filter(c => c.id !== id));
        if (selectedCampaign?.id === id) { setSelectedCampaign(null); router.push("/workspace/campaigns"); }
    };

    const handleFireNextReply = async (auto = false) => {
        if (!selectedCampaign) return;
        setIsReplying(true);
        setError(null);
        const res = await fetch(`${API_URL}/campaigns/${selectedCampaign.id}/next-target`, { credentials: "include" });
        const data = await res.json() as { target: CampaignTarget | null; reason?: string; stepIndex?: number; promptHint?: string; totalSteps?: number };
        if (!data.target) {
            setIsReplying(false);
            if (auto) {
                isAutoRunningRef.current = false;
                setIsAutoRunning(false);
                setAutoRunCount(0);
                setError(data.reason === "daily_quota_reached" ? "Daily quota reached — auto-run stopped." : "No more pending targets.");
            } else {
                setError("No pending targets left.");
            }
            return;
        }
        const target = data.target;
        const promptHint = data.promptHint ?? selectedCampaign.replyTemplate;
        window.postMessage({
            type: "NARRATIVEE_GENERATE_CAMPAIGN_REPLY",
            campaignId: selectedCampaign.id,
            targetId: target.id,
            context: {
                parentCommentContent: target.parentCommentContent,
                targetCommentContent: target.targetCommentContent,
                targetAuthorName: target.targetAuthorName,
                originalNoteContent: target.originalNoteContent,
                promptHint,
                postUrl: target.parentPostUrl,
            },
            targetCommentId: target.targetCommentId,
            postUrl: target.targetCommentUrl || target.parentPostUrl,
        }, "*");
    };

    // Keep ref in sync so the message handler's setTimeout always calls the latest version
    handleFireNextReplyRef.current = handleFireNextReply;

    const handleStartAutoRun = () => {
        if (!selectedCampaign) return;
        isAutoRunningRef.current = true;
        setIsAutoRunning(true);
        setAutoRunCount(0);
        setError(null);
        handleFireNextReply(true);
    };

    const handleStopAutoRun = () => {
        isAutoRunningRef.current = false;
        setIsAutoRunning(false);
        setAutoRunCount(0);
        setNextReplyCountdown(null);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };

    const handleSkipTarget = async (targetId: string) => {
        console.log('🎯 Skip clicked, selectedCampaign:', selectedCampaign?.id, 'targetId:', targetId);
        if (!selectedCampaign) { setError("No campaign selected"); return; }
        const res = await fetch(`${API_URL}/campaigns/${selectedCampaign.id}/targets/${targetId}/skip`, { method: "POST", credentials: "include" });
        console.log('🎯 Skip response:', res.status);
        if (!res.ok) { setError(`Failed to skip target (${res.status})`); return; }
        await fetchCampaign(selectedCampaign.id);
    };

    const handleResetTarget = async (targetId: string) => {
        if (!selectedCampaign) return;
        await fetch(`${API_URL}/campaigns/${selectedCampaign.id}/targets/${targetId}/reset`, { method: "POST", credentials: "include" });
        await fetchCampaign(selectedCampaign.id);
    };

    const handleMarkConversion = async (targetId: string, type: "replied-back" | "subscribed") => {
        if (!selectedCampaign) return;
        await fetch(`${API_URL}/campaigns/${selectedCampaign.id}/targets/${targetId}/${type}`, { method: "POST", credentials: "include" });
        fetchCampaign(selectedCampaign.id);
    };

    const statusColor = (status: Campaign["status"]) => {
        if (status === "active") return "text-green-400 bg-green-400/10";
        if (status === "paused") return "text-yellow-400 bg-yellow-400/10";
        if (status === "completed") return "text-blue-400 bg-blue-400/10";
        return "text-gray-400 bg-white/[0.05]";
    };

    const targetStatusIcon = (status: CampaignTarget["status"]) => {
        if (status === "replied") return <Check size={14} className="text-green-400" />;
        if (status === "skipped") return <SkipForward size={14} className="text-gray-500" />;
        if (status === "failed") return <X size={14} className="text-red-400" />;
        return <div className="w-2 h-2 rounded-full bg-primary" />;
    };

    // ── Create View ──────────────────────────────────────────────────────────────
    if (view === "create") {
        return (
            <div className="p-6 max-w-xl">
                <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={14} /> Back
                </button>
                <h1 className="text-xl font-semibold text-white mb-6">New Campaign</h1>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Campaign name</label>
                        <input
                            value={createForm.name}
                            onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Growth Replies — Week 1"
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm text-gray-400">
                                Message sequence <span className="text-gray-600 font-normal">(optional)</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setCreateForm(p => ({ ...p, sequenceSteps: [...p.sequenceSteps, ""] }))}
                                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                                <Plus size={11} /> Add step
                            </button>
                        </div>
                        <div className="space-y-2">
                            {createForm.sequenceSteps.map((step, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <span className="mt-3 text-xs text-gray-600 w-5 shrink-0 text-right">{i + 1}.</span>
                                    <textarea
                                        value={step}
                                        onChange={e => setCreateForm(p => {
                                            const steps = [...p.sequenceSteps];
                                            steps[i] = e.target.value;
                                            return { ...p, sequenceSteps: steps };
                                        })}
                                        placeholder={i === 0 ? "e.g. ask if they want to grow their newsletter" : "e.g. follow up — offer a free tip if they replied"}
                                        rows={2}
                                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 resize-none"
                                    />
                                    {createForm.sequenceSteps.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setCreateForm(p => ({ ...p, sequenceSteps: p.sequenceSteps.filter((_, j) => j !== i) }))}
                                            className="mt-2.5 text-gray-700 hover:text-red-400 transition-colors"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-1.5">
                            Step 1 is sent to every new target. Step 2+ are sent when they reply back.
                        </p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Daily quota</label>
                        <input
                            type="number" min={1} max={30}
                            value={createForm.dailyQuota}
                            onChange={e => setCreateForm(p => ({ ...p, dailyQuota: parseInt(e.target.value) || 5 }))}
                            className="w-32 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                        <p className="text-xs text-gray-600 mt-1">Max replies per day</p>
                    </div>
                    <button
                        onClick={handleCreateCampaign}
                        disabled={!createForm.name}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-colors"
                    >
                        Create Campaign
                    </button>
                </div>
            </div>
        );
    }

    // ── Detail View ──────────────────────────────────────────────────────────────
    if (view === "detail" && !selectedCampaign) {
        return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-gray-500" /></div>;
    }

    if (view === "detail" && selectedCampaign) {
        const pendingTargets = selectedCampaign.targets?.filter(t => t.status === "pending") || [];

        return (
            <div className="h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col gap-6">

                    <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors w-fit">
                        <ArrowLeft size={14} /> All campaigns
                    </button>

                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-100">{selectedCampaign.name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(selectedCampaign.status)}`}>
                                    {selectedCampaign.status}
                                </span>
                                <span className="text-xs text-gray-500">{selectedCampaign.totalReplies} total replies</span>
                                {isEditingQuota ? (
                                    <span className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500">{selectedCampaign.repliedToday}/</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={quotaDraft}
                                            onChange={e => setQuotaDraft(parseInt(e.target.value) || 1)}
                                            onKeyDown={e => { if (e.key === "Enter") handleSaveQuota(); if (e.key === "Escape") setIsEditingQuota(false); }}
                                            autoFocus
                                            className="w-12 text-xs bg-white/5 border border-white/10 rounded px-1 py-0.5 text-gray-200 text-center focus:outline-none focus:border-primary"
                                        />
                                        <button onClick={handleSaveQuota} className="text-primary hover:text-primary/80"><Check size={12} /></button>
                                        <button onClick={() => setIsEditingQuota(false)} className="text-gray-600 hover:text-gray-400"><X size={12} /></button>
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => { setQuotaDraft(selectedCampaign.dailyQuota); setIsEditingQuota(true); }}
                                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors group flex items-center gap-1"
                                        title="Edit daily quota"
                                    >
                                        {selectedCampaign.repliedToday}/{selectedCampaign.dailyQuota} today
                                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-600">(edit)</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedCampaign.status === "active" && pendingTargets.length > 0 && (
                                isAutoRunning ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">
                                            {isReplying ? (
                                                <><Loader2 size={12} className="animate-spin inline mr-1" />{autoRunCount} replied, posting...</>
                                            ) : nextReplyCountdown !== null ? (
                                                <><Loader2 size={12} className="animate-spin inline mr-1" />{autoRunCount} replied &mdash; next in {nextReplyCountdown}s</>
                                            ) : (
                                                <><Loader2 size={12} className="animate-spin inline mr-1" />{autoRunCount} replied&hellip;</>
                                            )}
                                        </span>
                                        <button
                                            onClick={handleStopAutoRun}
                                            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition-colors"
                                        >
                                            <Pause size={14} /> Stop
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleFireNextReply(false)}
                                            disabled={isReplying}
                                            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 border border-white/[0.06] text-gray-300 rounded-xl transition-colors"
                                        >
                                            {isReplying ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                                            {isReplying ? "Posting..." : "Reply to next"}
                                        </button>
                                        <button
                                            onClick={handleStartAutoRun}
                                            disabled={isReplying}
                                            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl transition-colors"
                                        >
                                            <Play size={14} /> Run all ({pendingTargets.length})
                                        </button>
                                    </div>
                                )
                            )}
                            <button
                                onClick={() => handleToggleStatus(selectedCampaign)}
                                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] text-gray-300 transition-colors"
                            >
                                {selectedCampaign.status === "active" ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Activate</>}
                            </button>
                            <button
                                onClick={() => handleDelete(selectedCampaign.id)}
                                className="p-2 rounded-xl border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
                            {error}
                            <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 ml-2">✕</button>
                        </div>
                    )}

                    {/* Sequence editor */}
                    {(() => {
                        const steps: string[] = Array.isArray(selectedCampaign.sequenceSteps) && selectedCampaign.sequenceSteps.length > 0
                            ? selectedCampaign.sequenceSteps as string[]
                            : [selectedCampaign.replyTemplate ?? ""];
                        const saveSequence = async (newSteps: string[]) => {
                            await fetch(`${API_URL}/campaigns/${selectedCampaign.id}`, {
                                method: "PATCH",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ sequenceSteps: newSteps }),
                            });
                            await fetchCampaign(selectedCampaign.id);
                        };
                        return (
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={13} className="text-primary" />
                                        <span className="text-sm font-medium text-gray-300">Message Sequence</span>
                                        <span className="text-xs text-gray-600">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const newSteps = [...steps, ""];
                                            await saveSequence(newSteps);
                                        }}
                                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={11} /> Add step
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {steps.map((step, i) => (
                                        <div key={i} className="flex gap-2 items-start">
                                            <div className="mt-2.5 shrink-0 flex flex-col items-center gap-0.5">
                                                <span className="text-xs text-gray-600 w-5 text-right">{i + 1}.</span>
                                                {i > 0 && <span className="text-[9px] text-gray-700">↩ reply</span>}
                                            </div>
                                            <input
                                                defaultValue={step}
                                                onBlur={async e => {
                                                    const newSteps = [...steps];
                                                    newSteps[i] = e.target.value;
                                                    await saveSequence(newSteps);
                                                }}
                                                placeholder={i === 0 ? "AI angle for first message…" : "AI angle for follow-up…"}
                                                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                                            />
                                            {steps.length > 1 && (
                                                <button
                                                    onClick={async () => await saveSequence(steps.filter((_, j) => j !== i))}
                                                    className="mt-2 text-gray-700 hover:text-red-400 transition-colors"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {steps.length > 1 && (
                                    <p className="text-xs text-gray-600 mt-2">
                                        Step 1 → sent to every new target. Step 2+ → sent when they reply back.
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    <div className="flex gap-6">
                        {/* Left: Feed + target picker */}
                        <div className="flex-1 min-w-0">
                            {/* Feed controls */}
                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                                <button
                                    onClick={handlePullFeed}
                                    disabled={isFeedLoading || isKeywordSearching}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-gray-200 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isFeedLoading ? <Loader2 size={14} className="animate-spin" /> : <Rss size={14} className="text-primary" />}
                                    {isFeedLoading ? "Pulling feed..." : "Pull Feed"}
                                </button>

                                <span className="text-xs text-gray-600">or</span>

                                {/* Keyword search */}
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        value={searchKeyword}
                                        onChange={e => setSearchKeyword(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") handleKeywordSearch(); }}
                                        placeholder="Search keyword..."
                                        className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 w-44"
                                    />
                                    <button
                                        onClick={handleKeywordSearch}
                                        disabled={isKeywordSearching || !searchKeyword.trim()}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium rounded-xl transition-all disabled:opacity-40"
                                    >
                                        {isKeywordSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                        {isKeywordSearching ? "Searching..." : "Search"}
                                    </button>
                                </div>

                                {/* Min comments filter */}
                                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                                    <MessageSquare size={13} className="text-gray-500 shrink-0" />
                                    <span className="text-xs text-gray-500">min</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={minComments}
                                        onChange={e => setMinComments(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-10 bg-transparent text-sm text-white text-center focus:outline-none"
                                    />
                                    <span className="text-xs text-gray-500">comments</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    {lastPulled && (
                                        <span className="flex items-center gap-1"><Clock size={10} /> {lastPulled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                    )}
                                    {feedNotes.length > 0 && (
                                        <span>
                                            {feedNotes.filter(n => n.engagement.comments >= minComments).length}/{feedNotes.length} notes
                                        </span>
                                    )}
                                </div>

                                {totalSelected > 0 && (
                                    <div className="ml-auto flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedTargetIds(new Set())}
                                            className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            Deselect All
                                        </button>
                                        <button
                                            onClick={handleAddSelected}
                                            disabled={isAddingTargets}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
                                        >
                                            {isAddingTargets ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                                            {isAddingTargets ? "Adding..." : `Add ${totalSelected} target${totalSelected !== 1 ? "s" : ""}`}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Feed loading */}
                            {(isFeedLoading || isKeywordSearching) && (
                                <div className="flex flex-col items-center py-16 gap-3">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <p className="text-sm text-gray-400">{isKeywordSearching ? `Searching Substack for "${searchKeyword}"...` : "Scraping your Substack feed..."}</p>
                                    <p className="text-xs text-gray-600">{isKeywordSearching ? "This may take 30–60 seconds" : "This may take 20–30 seconds"}</p>
                                </div>
                            )}

                            {/* Filter empty state */}
                            {!isFeedLoading && feedNotes.length > 0 && feedNotes.filter(n => n.engagement.comments >= minComments).length === 0 && (
                                <div className="text-center py-12 text-gray-600 text-sm">
                                    No notes with {minComments}+ comments in this feed. Lower the threshold or pull a fresh feed.
                                </div>
                            )}

                            {/* Feed empty */}
                            {!isFeedLoading && !isKeywordSearching && feedNotes.length === 0 && (
                                <div className="flex flex-col items-center py-16 gap-3">
                                    <div className="w-12 h-12 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-center">
                                        <Rss size={20} className="text-gray-600" />
                                    </div>
                                    <p className="text-gray-400 text-sm">Pull your feed or search by keyword</p>
                                    <p className="text-gray-600 text-xs max-w-xs text-center">
                                        Click &ldquo;Pull Feed&rdquo; to scrape trending notes, or search by keyword on Substack Explore to find notes, then pull 2nd-degree commenters from them.
                                    </p>
                                    <button
                                        onClick={handlePullFeed}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm rounded-xl transition-all"
                                    >
                                        <Rss size={14} /> Pull Feed
                                    </button>
                                </div>
                            )}

                            {/* Feed notes grid */}
                            {feedNotes.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {feedNotes.filter(n => n.engagement.comments >= minComments).map(note => (
                                        <FeedNoteCard
                                            key={note.id}
                                            note={note}
                                            onPullCommenters={handleScrapeNote}
                                            isScrapingThisNote={scrapingNoteUrl === note.url}
                                            scrapedTargets={targetsByNote[note.url] || []}
                                            selectedIds={selectedTargetIds}
                                            onToggleSelect={toggleSelectTarget}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Saved targets */}
                        {(selectedCampaign.targets?.length || 0) > 0 && (
                            <div className="w-80 shrink-0">
                                {/* Conversion summary */}
                                {(() => {
                                    const targets = selectedCampaign.targets || [];
                                    const replied = targets.filter(t => t.status === "replied").length;
                                    const repliedBack = targets.filter(t => t.targetRepliedBack).length;
                                    const subscribed = targets.filter(t => t.targetSubscribed).length;
                                    return (
                                        <div className="flex items-center gap-3 mb-3 text-xs">
                                            <span className="text-gray-500 font-medium uppercase tracking-wider">Targets ({targets.length})</span>
                                            <button onClick={handleClearTargets} className="text-gray-700 hover:text-red-400 transition-colors" title="Clear all targets"><Trash2 size={11} /></button>
                                            {replied > 0 && <span className="text-green-400">{replied} replied</span>}
                                            {repliedBack > 0 && <span className="text-blue-400">↩ {repliedBack}</span>}
                                            {subscribed > 0 && <span className="text-primary">★ {subscribed}</span>}
                                            {selectedCampaign.status === "active" && targets.filter(t => t.status === "pending").length > 0 && (
                                                isAutoRunning ? (
                                                    <button
                                                        onClick={handleStopAutoRun}
                                                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors"
                                                    >
                                                        <Pause size={11} /> Stop ({autoRunCount} done)
                                                    </button>
                                                ) : (
                                                    <div className="ml-auto flex items-center gap-1.5">
                                                        <button
                                                            onClick={handleSkipAllPending}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 text-xs font-medium rounded-lg transition-colors"
                                                            title="Skip all pending targets"
                                                        >
                                                            <SkipForward size={11} /> Skip all
                                                        </button>
                                                        <button
                                                            onClick={handleStartAutoRun}
                                                            disabled={isReplying}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            {isReplying ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                                                            {isReplying ? "Replying..." : `Run all (${targets.filter(t => t.status === "pending").length})`}
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    );
                                })()}
                                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                                    {(selectedCampaign.targets || []).map(target => {
                                        if (!target) return null;
                                        return (
                                            <div key={target.id} className="bg-[#1a1b1d] rounded-xl border border-white/[0.06] p-3">
                                            <div className="flex items-start gap-2.5">
                                                <div className="mt-0.5 shrink-0">{targetStatusIcon(target.status)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-xs font-medium text-white truncate">
                                                            {target.targetAuthorName || target.targetAuthorHandle || "Unknown"}
                                                        </p>
                                                        {(target.targetCommentUrl || target.parentCommentUrl) && (
                                                            <a
                                                                href={target.targetCommentUrl || target.parentCommentUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={e => e.stopPropagation()}
                                                                className="text-gray-600 hover:text-primary transition-colors shrink-0"
                                                                title="Open comment"
                                                            >
                                                                <ExternalLink size={10} />
                                                            </a>
                                                        )}
                                                        {target.sequenceStep > 0 && (
                                                            <span title={`Sequence step ${target.sequenceStep} sent`} className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                                                s{target.sequenceStep}
                                                            </span>
                                                        )}
                                                        {target.targetRepliedBack && <span title="Replied back" className="text-blue-400 text-[10px]">↩</span>}
                                                        {target.targetSubscribed && <span title="Subscribed" className="text-primary text-[10px]">★</span>}
                                                    </div>
                                                    {target.targetCommentContent && (
                                                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">&ldquo;{target.targetCommentContent}&rdquo;</p>
                                                    )}
                                                    {target.replyText && (
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic">You: &ldquo;{target.replyText}&rdquo;</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 shrink-0">
                                                    {target.status === "pending" && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSkipTarget(target.id); }}
                                                            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded"
                                                            title="Skip"
                                                        >
                                                            <SkipForward size={14} />
                                                        </button>
                                                    )}
                                                    {(target.status === "skipped" || target.status === "failed") && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleResetTarget(target.id); }}
                                                            className="p-1.5 text-gray-600 hover:text-primary transition-colors rounded"
                                                            title="Reset to pending"
                                                        >
                                                            <Play size={12} />
                                                        </button>
                                                    )}
                                                    {target.status === "replied" && !target.targetRepliedBack && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMarkConversion(target.id, "replied-back"); }}
                                                            className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors rounded"
                                                            title="Mark as replied back"
                                                        >
                                                            <MessageSquare size={11} />
                                                        </button>
                                                    )}
                                                    {target.status === "replied" && !target.targetSubscribed && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMarkConversion(target.id, "subscribed"); }}
                                                            className="p-1.5 text-gray-500 hover:text-primary transition-colors rounded"
                                                            title="Mark as subscribed"
                                                        >
                                                            <TrendingUp size={11} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── List View ────────────────────────────────────────────────────────────────
    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-100">Campaigns</h1>
                        <p className="text-sm text-gray-500 mt-1">Engage 2nd-degree commenters at scale</p>
                    </div>
                    <button
                        onClick={() => setView("create")}
                        className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors"
                    >
                        <Plus size={16} /> New Campaign
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={20} className="animate-spin text-gray-500" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-14 h-14 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-center">
                            <Users size={24} className="text-gray-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-300 font-medium mb-1">No campaigns yet</p>
                            <p className="text-gray-600 text-sm max-w-xs">Pull your Substack feed, pick notes, and add 2nd-degree commenters as targets.</p>
                        </div>
                        <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium rounded-xl transition-all">
                            <Plus size={16} /> New Campaign
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(campaigns || []).map(campaign => {
                            if (!campaign || !campaign.id) return null;
                            return (
                                <button
                                    key={campaign.id}
                                    onClick={() => { fetchCampaign(campaign.id); router.push(`/workspace/campaigns?id=${campaign.id}`); }}
                                    className="w-full text-left bg-[#1a1b1d] rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.1] transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-medium text-white">{campaign.name || "Untitled Campaign"}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(campaign.status)}`}>
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><MessageSquare size={11} /> {campaign.totalReplies || 0} replies</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><Target size={11} /> {campaign.repliedToday || 0}/{campaign.dailyQuota || 0} today</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CampaignsPageWrapper() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <CampaignsPage />
        </Suspense>
    );
}
