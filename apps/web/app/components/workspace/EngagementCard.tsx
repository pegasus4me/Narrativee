"use client";

import { useState } from "react";
import { Loader2, Send, RefreshCw, MessageSquare, Heart, Repeat2, ExternalLink, X, Sparkles } from "lucide-react";

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

interface EngagementCardProps {
    note: EngagementNote;
    onGenerateComment: (note: EngagementNote) => Promise<string>;
    onPostComment: (noteUrl: string, comment: string) => void;
    onSkip: (noteId: string) => void;
}

export default function EngagementCard({ note, onGenerateComment, onPostComment, onSkip }: EngagementCardProps) {
    const [comment, setComment] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [posted, setPosted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const generated = await onGenerateComment(note);
            setComment(generated);
        } catch (e: any) {
            setError(e.message || "Failed to generate");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePost = () => {
        if (!comment.trim()) return;
        setIsPosting(true);
        onPostComment(note.url, comment);
        setTimeout(() => {
            setIsPosting(false);
            setPosted(true);
        }, 5000);
    };

    const engagementScore = note.engagement.likes * 1 + note.engagement.comments * 3 + note.engagement.restacks * 5;
    const scoreColor = engagementScore > 50 ? "text-emerald-400 bg-emerald-900/20 border-emerald-800/30"
        : engagementScore > 20 ? "text-amber-400 bg-amber-900/20 border-amber-800/30"
        : "text-gray-400 bg-gray-800/20 border-gray-700/30";

    return (
        <div className={`bg-[#1a1b1d] rounded-xl border flex flex-col transition-all ${posted ? 'border-emerald-800/40 opacity-60' : 'border-white/[0.06] hover:border-white/[0.1]'}`}>
            {/* Note Content */}
            <div className="p-5 flex-1">
                {/* Author Header */}
                <div className="flex items-center gap-3 mb-3">
                    {note.author.avatar ? (
                        <img src={note.author.avatar} alt={note.author.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-900/40 flex items-center justify-center text-blue-400 font-semibold text-sm shrink-0">
                            {note.author.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200 truncate">{note.author.name}</div>
                        {note.author.handle && <div className="text-xs text-gray-500">@{note.author.handle}</div>}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <a href={note.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {!posted && (
                            <button onClick={() => onSkip(note.id)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Note Text */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
                    {note.content.length > 280 ? note.content.slice(0, 280) + '...' : note.content}
                </p>

                {/* Engagement Stats */}
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="w-3 h-3" /> {note.engagement.likes}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Repeat2 className="w-3 h-3" /> {note.engagement.restacks}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3" /> {note.engagement.comments}
                    </span>
                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                        {engagementScore} score
                    </span>
                </div>
            </div>

            {/* Comment Section */}
            <div className="border-t border-white/[0.04] p-4">
                {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

                {!comment && !isGenerating && !posted && (
                    <button
                        onClick={handleGenerate}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/[0.06] text-gray-300 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        Generate Reply
                    </button>
                )}

                {isGenerating && (
                    <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Crafting your reply...
                    </div>
                )}

                {comment && !posted && (
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-[#111] text-gray-200 text-sm rounded-lg border border-white/[0.06] p-3 resize-none focus:outline-none focus:border-violet-500/50"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleGenerate}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-white/[0.06]"
                            >
                                <RefreshCw className="w-3 h-3" /> Redo
                            </button>
                            <button
                                onClick={handlePost}
                                disabled={isPosting || !comment.trim()}
                                className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                                Post Comment
                            </button>
                        </div>
                    </div>
                )}

                {posted && (
                    <div className="text-center py-1.5 text-xs text-emerald-400 font-medium">
                        ✓ Comment posted
                    </div>
                )}
            </div>
        </div>
    );
}
