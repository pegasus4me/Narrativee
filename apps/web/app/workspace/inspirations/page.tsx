"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, TrendingUp, Heart, Repeat2, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import InspirationCard from "@/app/components/workspace/InspirationCard";
import { InspirationNote, InspirationFilters, SortOption } from "@/app/types/inspiration";

const STORAGE_KEY = "narrativee_inspirations_v1";

const SORT_OPTIONS: { value: SortOption; label: string; icon: any }[] = [
    { value: "newest", label: "Newest First", icon: Sparkles },
    { value: "total-engagement", label: "Total Engagement", icon: TrendingUp },
    { value: "most-liked", label: "Most Liked", icon: Heart },
    { value: "most-restacked", label: "Most Restacked", icon: Repeat2 },
    { value: "most-commented", label: "Most Commented", icon: MessageCircle },
];

export default function InspirationsPage() {
    const [notes, setNotes] = useState<InspirationNote[]>([]);
    const [filters, setFilters] = useState<InspirationFilters>({
        sortBy: "newest",
        searchQuery: "",
        tags: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load notes: listen for data from extension content script bridge
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            // Initial load of all saved inspirations from chrome.storage.local (via content script bridge)
            if (event.data?.type === 'NARRATIVEE_INSPIRATIONS_LOADED') {
                console.log('📥 Loaded', event.data.notes.length, 'inspirations from extension');
                setNotes(event.data.notes);
                setIsLoading(false);
            }

            // Real-time: new note saved from Substack tab
            if (event.data?.type === 'NARRATIVEE_INSPIRATION_SAVED') {
                console.log('📥 New inspiration saved from extension:', event.data.note);
                const newNote: InspirationNote = event.data.note;
                setNotes(prev => {
                    const updated = [newNote, ...prev.filter(n => n.id !== newNote.id)];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    return updated;
                });
            }
        };

        window.addEventListener('message', handleMessage);

        // Also try loading from localStorage as fallback
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved inspirations:", e);
            }
        }

        // Stop loading spinner after a timeout if extension doesn't respond
        const timeout = setTimeout(() => setIsLoading(false), 3000);

        return () => {
            window.removeEventListener('message', handleMessage);
            clearTimeout(timeout);
        };
    }, []);

    // Save to localStorage whenever notes change
    const saveNotes = (updatedNotes: InspirationNote[]) => {
        setNotes(updatedNotes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    };

    // Filter and sort notes
    const filteredAndSortedNotes = useMemo(() => {
        let result = [...notes];

        // Apply search filter
        if (filters.searchQuery.trim()) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(note =>
                note.content.toLowerCase().includes(query) ||
                note.author.name.toLowerCase().includes(query) ||
                note.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply tag filter
        if (filters.tags.length > 0) {
            result = result.filter(note =>
                filters.tags.every(filterTag => note.tags.includes(filterTag))
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case "newest":
                    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
                case "most-liked":
                    return b.engagement.likes - a.engagement.likes;
                case "most-restacked":
                    return b.engagement.restacks - a.engagement.restacks;
                case "most-commented":
                    return b.engagement.comments - a.engagement.comments;
                case "total-engagement":
                    const totalB = b.engagement.likes + b.engagement.restacks + b.engagement.comments;
                    const totalA = a.engagement.likes + a.engagement.restacks + a.engagement.comments;
                    return totalB - totalA;
                default:
                    return 0;
            }
        });

        return result;
    }, [notes, filters]);

    // Get all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [notes]);

    const handleAddToQueue = (note: InspirationNote) => {
        // Create a post for the scheduler
        const post = {
            id: crypto.randomUUID(),
            content: note.content,
            time: "",
            status: "draft" as const,
            date: new Date().toISOString().split('T')[0],
        };

        // Add to scheduler
        const existingPosts = JSON.parse(localStorage.getItem("narrativee_scheduler_posts_v3") || "[]");
        localStorage.setItem(
            "narrativee_scheduler_posts_v3",
            JSON.stringify([...existingPosts, post])
        );

        // Show confirmation (you could add a toast notification here)
        alert("Added to Post Queue! ✨");
    };

    const handleDelete = (id: string) => {
        if (confirm("Remove this note from your inspirations?")) {
            saveNotes(notes.filter(n => n.id !== id));
        }
    };

    const handleUpdateTags = (id: string, tags: string[]) => {
        saveNotes(notes.map(n => n.id === id ? { ...n, tags } : n));
    };

    const handleUpdateNotes = (id: string, personalNotes: string) => {
        saveNotes(notes.map(n => n.id === id ? { ...n, notes: personalNotes } : n));
    };

    const handleToggleTagFilter = (tag: string) => {
        setFilters(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl text-gray-100 mb-2">Inspirations</h1>
                    <p className="text-gray-400">
                        Hot notes with high engagement to inspire your content
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={filters.searchQuery}
                            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                            placeholder="Search notes, authors, or tags..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[#1e1f21] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as SortOption })}
                                className="px-3 py-1.5 bg-[#1e1f21] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tag Filters */}
                        {allTags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500">Tags:</span>
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleToggleTagFilter(tag)}
                                        className={`px-2 py-1 text-xs rounded-full transition-colors ${filters.tags.includes(tag)
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Results count */}
                        <span className="ml-auto text-sm text-gray-500">
                            {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? 'note' : 'notes'}
                        </span>
                    </div>
                </div>

                {/* Notes Grid */}
                {filteredAndSortedNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedNotes.map(note => (
                            <InspirationCard
                                key={note.id}
                                note={note}
                                onAddToQueue={handleAddToQueue}
                                onDelete={handleDelete}
                                onUpdateTags={handleUpdateTags}
                                onUpdateNotes={handleUpdateNotes}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                            <Sparkles className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl text-gray-300 mb-2">No inspirations yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {filters.searchQuery || filters.tags.length > 0
                                ? "No notes match your filters. Try adjusting your search or tag selection."
                                : "Start saving hot notes from Substack using the Chrome extension, or add notes manually."}
                        </p>
                        {notes.length === 0 && (
                            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 max-w-md mx-auto text-left">
                                <p className="text-blue-300 text-sm mb-2">
                                    <strong>Coming soon:</strong> Chrome Extension
                                </p>
                                <p className="text-blue-400 text-xs">
                                    Install the Narrativee extension to easily save high-engagement notes while browsing Substack.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}