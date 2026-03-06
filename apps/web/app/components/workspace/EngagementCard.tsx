"use client";

import { useState } from "react";
import { Loader2, Send, RefreshCw, MessageSquare, Heart, Repeat2, ExternalLink } from "lucide-react";
import PrimaryButton from "../commons/PrimaryButton";

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
}

export default function EngagementCard({ note, onGenerateComment, onPostComment }: EngagementCardProps) {
    const [comment, setComment] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [posted, setPosted] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const generated = await onGenerateComment(note);
            setComment(generated);
        } catch (e) {
            console.error("Failed to generate comment:", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePost = () => {
        if (!comment.trim()) return;
        setIsPosting(true);
        onPostComment(note.url, comment);
        // The result will come back via message
        setTimeout(() => {
            setIsPosting(false);
            setPosted(true);
        }, 5000);
    };

    const handleRegenerate = () => {
        setComment("");
        handleGenerate();
    };

    return (
        <div className={`bg-[#1e1f21] rounded-xl  transition-all ${posted ? 'border-green-500/30 opacity-60' : 'border-gray-700/50 hover:border-gray-600'}`}>
            {/* Note Content */}
            <div className="p-5">
                {/* Author Header */}
                <div className="flex items-center gap-3 mb-3">
                    {note.author.avatar ? (
                        <img
                            src={note.author.avatar}
                            alt={note.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-medium text-sm">
                            {note.author.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200 truncate">{note.author.name}</div>
                        {note.author.handle && (
                            <div className="text-xs text-gray-500">@{note.author.handle}</div>
                        )}
                    </div>
                    <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* Note Text */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
                    {note.content.length > 300 ? note.content.slice(0, 300) + '...' : note.content}
                </p>

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> {note.engagement.likes}
                    </span>
                    <span className="flex items-center gap-1">
                        <Repeat2 className="w-3.5 h-3.5" /> {note.engagement.restacks}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {note.engagement.comments}
                    </span>
                </div>
            </div>

            {/* Comment Section */}
            <div className="border-t border-gray-700/30 p-4">
                {!comment && !isGenerating && !posted && (
                    <PrimaryButton
                        onClick={handleGenerate}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Generate Reply
                    </PrimaryButton>
                )}

                {isGenerating && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Crafting your reply...
                    </div>
                )}

                {comment && !posted && (
                    <div className="space-y-3">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-[#2a2b2e] text-gray-200 text-sm rounded-lg border border-gray-600/50 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                            rows={3}
                            placeholder="Your comment..."
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleRegenerate}
                                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Regenerate
                            </button>
                            <button
                                onClick={handlePost}
                                disabled={isPosting || !comment.trim()}
                                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {isPosting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                Post Comment
                            </button>
                        </div>
                    </div>
                )}

                {posted && (
                    <div className="text-center py-2 text-sm text-green-400 font-medium">
                        ✓ Comment posted
                    </div>
                )}
            </div>
        </div>
    );
}
