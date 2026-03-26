"use client";

import { useState } from "react";
import { Heart, Repeat2, MessageCircle, ExternalLink, Trash2, Plus, Calendar, BookmarkCheck } from "lucide-react";
import { InspirationNote } from "@/app/types/inspiration";

interface InspirationCardProps {
    note: InspirationNote;
    onAddToQueue: (note: InspirationNote) => void;
    onDelete: (id: string) => void;
    onUpdateTags: (id: string, tags: string[]) => void;
    onUpdateNotes: (id: string, notes: string) => void;
}

export default function InspirationCard({ note, onAddToQueue, onDelete, onUpdateTags, onUpdateNotes }: InspirationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [notesInput, setNotesInput] = useState(note.notes || "");

    const totalEngagement = note.engagement.likes + note.engagement.restacks + note.engagement.comments;
    const savedDate = new Date(note.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const contentPreview = note.content.length > 220 ? note.content.substring(0, 220) + "..." : note.content;

    const handleAddTag = () => {
        if (tagInput.trim() && !note.tags.includes(tagInput.trim())) {
            onUpdateTags(note.id, [...note.tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleSaveNotes = () => {
        onUpdateNotes(note.id, notesInput);
        setIsEditingNotes(false);
    };

    const scoreColor = totalEngagement > 50 ? "text-emerald-400 bg-emerald-900/20 border-emerald-800/30"
        : totalEngagement > 20 ? "text-amber-400 bg-amber-900/20 border-amber-800/30"
        : "text-gray-400 bg-gray-800/20 border-gray-700/30";

    return (
        <div className="bg-[#1a1b1d] rounded-xl border border-white/[0.06] hover:border-white/[0.1] transition-all flex flex-col group">
            <div className="p-5 flex-1 flex flex-col gap-3">
                {/* Author */}
                <div className="flex items-center gap-3">
                    {note.author.avatar ? (
                        <img src={note.author.avatar} alt={note.author.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-violet-900/40 flex items-center justify-center text-violet-400 font-semibold text-sm shrink-0">
                            {note.author.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{note.author.name}</p>
                        {note.author.handle && <p className="text-xs text-gray-500">@{note.author.handle}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={note.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => onDelete(note.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {isExpanded ? note.content : contentPreview}
                    </p>
                    {note.content.length > 220 && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors">
                            {isExpanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Heart className="w-3 h-3" /> {note.engagement.likes}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Repeat2 className="w-3 h-3" /> {note.engagement.restacks}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><MessageCircle className="w-3 h-3" /> {note.engagement.comments}</span>
                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${scoreColor}`}>{totalEngagement} score</span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {note.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-violet-900/20 text-violet-400 text-[10px] rounded-full border border-violet-800/30 font-medium">
                            {tag}
                            <button onClick={() => onUpdateTags(note.id, note.tags.filter(t => t !== tag))} className="hover:text-red-400 transition-colors">×</button>
                        </span>
                    ))}
                    {isEditingTags ? (
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); if (e.key === "Escape") { setIsEditingTags(false); setTagInput(""); } }}
                                placeholder="tag..."
                                className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-200 text-xs rounded-lg focus:outline-none focus:border-violet-500/50 w-20"
                                autoFocus
                            />
                            <button onClick={handleAddTag} className="text-violet-400 hover:text-violet-300 text-xs">Add</button>
                            <button onClick={() => { setIsEditingTags(false); setTagInput(""); }} className="text-gray-600 hover:text-gray-400 text-xs">×</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditingTags(true)} className="flex items-center gap-0.5 text-gray-600 hover:text-gray-400 text-xs transition-colors">
                            <Plus className="w-3 h-3" /> tag
                        </button>
                    )}
                </div>

                {/* Personal notes */}
                {isEditingNotes ? (
                    <div>
                        <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Why did you save this?"
                            className="w-full p-2.5 bg-white/[0.03] border border-white/[0.06] text-gray-300 text-xs rounded-lg resize-none focus:outline-none focus:border-violet-500/50"
                            rows={3}
                        />
                        <div className="flex gap-2 mt-1.5">
                            <button onClick={handleSaveNotes} className="text-violet-400 hover:text-violet-300 text-xs">Save</button>
                            <button onClick={() => { setIsEditingNotes(false); setNotesInput(note.notes || ""); }} className="text-gray-600 hover:text-gray-400 text-xs">Cancel</button>
                        </div>
                    </div>
                ) : note.notes ? (
                    <div onClick={() => setIsEditingNotes(true)} className="p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg text-xs text-gray-500 italic cursor-pointer hover:border-white/10 transition-colors">
                        "{note.notes}"
                    </div>
                ) : (
                    <button onClick={() => setIsEditingNotes(true)} className="text-xs text-gray-600 hover:text-gray-400 text-left transition-colors">
                        + Add personal note
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.04] p-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-[10px] text-gray-600"><Calendar className="w-3 h-3" /> {savedDate}</span>
                <button
                    onClick={() => onAddToQueue(note)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.06] text-gray-300 text-xs font-medium rounded-lg transition-all"
                >
                    <BookmarkCheck className="w-3.5 h-3.5 text-violet-400" />
                    Add to Queue
                </button>
            </div>
        </div>
    );
}
