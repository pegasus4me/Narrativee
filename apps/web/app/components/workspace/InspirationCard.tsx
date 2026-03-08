"use client";

import { useState } from "react";
import { Heart, Repeat2, MessageCircle, ExternalLink, Trash2, Tag, Plus, Calendar } from "lucide-react";
import { InspirationNote } from "@/app/types/inspiration";
import PrimaryButton from "../commons/PrimaryButton";

interface InspirationCardProps {
    note: InspirationNote;
    onAddToQueue: (note: InspirationNote) => void;
    onDelete: (id: string) => void;
    onUpdateTags: (id: string, tags: string[]) => void;
    onUpdateNotes: (id: string, notes: string) => void;
}

export default function InspirationCard({
    note,
    onAddToQueue,
    onDelete,
    onUpdateTags,
    onUpdateNotes
}: InspirationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [notesInput, setNotesInput] = useState(note.notes || "");

    const totalEngagement = note.engagement.likes + note.engagement.restacks + note.engagement.comments;
    const savedDate = new Date(note.savedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const handleAddTag = () => {
        if (tagInput.trim() && !note.tags.includes(tagInput.trim())) {
            onUpdateTags(note.id, [...note.tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onUpdateTags(note.id, note.tags.filter(t => t !== tagToRemove));
    };

    const handleSaveNotes = () => {
        onUpdateNotes(note.id, notesInput);
        setIsEditingNotes(false);
    };

    const contentPreview = note.content.length > 200
        ? note.content.substring(0, 200) + "..."
        : note.content;


    return (
        <div className="bg-[#1e1f21] rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-all group flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
                {/* Header - Author Info */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
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
                        <div>
                            <p className="text-gray-200 font-medium text-sm">{note.author.name}</p>
                            {note.author.handle && (
                                <p className="text-gray-500 text-xs">@{note.author.handle}</p>
                            )}
                            {note.author.publicationName && (
                                <p className="text-gray-500 text-xs">{note.author.publicationName}</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                            title="View on Substack"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                            onClick={() => onDelete(note.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            title="Remove from inspirations"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="mb-3">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {isExpanded ? note.content : contentPreview}
                    </p>
                    {note.content.length > 200 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-blue-400 text-xs mt-1 hover:underline"
                        >
                            {isExpanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </div>

                {/* Engagement Metrics */}
                <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-700">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Heart className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-gray-400">{note.engagement.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Repeat2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-gray-400">{note.engagement.restacks}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-gray-400">{note.engagement.comments}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Saved {savedDate}</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-3.5 h-3.5 text-gray-500" />
                        {note.tags.length > 0 ? (
                            note.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded-full flex items-center gap-1"
                                >
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-xs">No tags</span>
                        )}
                        {isEditingTags ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddTag();
                                        } else if (e.key === 'Escape') {
                                            setIsEditingTags(false);
                                            setTagInput("");
                                        }
                                    }}
                                    placeholder="Tag name..."
                                    className="px-2 py-0.5 bg-[#2a2b2d] border border-gray-600 text-gray-200 text-xs rounded focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddTag}
                                    className="text-blue-400 hover:text-blue-300 text-xs"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingTags(false);
                                        setTagInput("");
                                    }}
                                    className="text-gray-500 hover:text-gray-300 text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditingTags(true)}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs"
                            >
                                <Plus className="w-3 h-3" />
                                Add tag
                            </button>
                        )}
                    </div>
                </div>

                {/* Personal Notes */}
                {isEditingNotes ? (
                    <div className="mb-3">
                        <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Why did you save this? What inspires you about it?"
                            className="w-full p-2 bg-[#2a2b2d] border border-gray-600 text-gray-200 text-xs rounded resize-none focus:outline-none focus:border-blue-500"
                            rows={3}
                        />
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={handleSaveNotes}
                                className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingNotes(false);
                                    setNotesInput(note.notes || "");
                                }}
                                className="text-gray-500 hover:text-gray-300 text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : note.notes ? (
                    <div
                        onClick={() => setIsEditingNotes(true)}
                        className="mb-3 p-2 bg-[#252627] rounded text-xs text-gray-400 italic cursor-pointer hover:bg-[#2a2b2d]"
                    >
                        "{note.notes}"
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditingNotes(true)}
                        className="mb-3 text-gray-500 hover:text-gray-300 text-xs"
                    >
                        + Add personal notes
                    </button>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700/30">
                <PrimaryButton
                    onClick={() => onAddToQueue(note)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                >
                    Add to Post Queue
                </PrimaryButton>
            </div>
        </div>
    );
}
