"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, TrendingUp, Heart, Repeat2, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import InspirationCard from "@/app/components/workspace/InspirationCard";
import { InspirationNote, InspirationFilters, SortOption } from "@/app/types/inspiration";
import { API_URL } from "@/lib/api-config";

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

    // ── Load from backend ──────────────────────────────────────────────────────
    const loadFromBackend = async () => {
        try {
            const res = await fetch(`${API_URL}/inspirations`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                return (data.notes as InspirationNote[]) || [];
            }
        } catch (e) {
            console.error("Failed to load inspirations from backend:", e);
        }
        return [];
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Primary source: backend DB
        loadFromBackend().then((backendNotes) => {
            setNotes(backendNotes);
            setIsLoading(false);
        });

        // Real-time: new note saved from Substack extension tab
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;

            if (event.data?.type === "NARRATIVEE_INSPIRATION_SAVED") {
                const newNote: InspirationNote = event.data.note;
                console.log("💡 [Inspirations] Received save event from extension:", newNote.id);
                // Save to backend then add to UI
                fetch(`${API_URL}/inspirations`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes: [newNote] }),
                }).then((res) => {
                    console.log("💡 [Inspirations] Save response status:", res.status);
                    if (res.ok) {
                        setNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
                    } else {
                        console.error("💡 [Inspirations] Save failed on backend");
                    }
                }).catch(err => {
                    console.error("💡 [Inspirations] Fetch error:", err);
                });
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // ── Mutations ──────────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this note from your inspirations?")) return;
        // Optimistic update
        setNotes((prev) => prev.filter((n) => n.id !== id));
        try {
            await fetch(`${API_URL}/inspirations/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
        } catch (e) {
            console.error("Delete failed:", e);
            // Re-load to ensure UI is consistent
            loadFromBackend().then(setNotes);
        }
    };

    const handleUpdateTags = async (id: string, tags: string[]) => {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, tags } : n)));
        await fetch(`${API_URL}/inspirations/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags }),
        }).catch(console.error);
    };

    const handleUpdateNotes = async (id: string, personalNotes: string) => {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, notes: personalNotes } : n)));
        await fetch(`${API_URL}/inspirations/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: personalNotes }),
        }).catch(console.error);
    };

    const handleAddToQueue = (note: InspirationNote) => {
        const post = {
            id: crypto.randomUUID(),
            content: note.content,
            time: "",
            status: "draft" as const,
            date: new Date().toISOString().split("T")[0],
        };
        const existing = JSON.parse(localStorage.getItem("narrativee_scheduler_posts_v3") || "[]");
        localStorage.setItem("narrativee_scheduler_posts_v3", JSON.stringify([...existing, post]));
        alert("Added to Post Queue! ✨");
    };

    // ── Filter + Sort ──────────────────────────────────────────────────────────
    const filteredAndSortedNotes = useMemo(() => {
        let result = [...notes];
        if (filters.searchQuery.trim()) {
            const q = filters.searchQuery.toLowerCase();
            result = result.filter(
                (n) =>
                    n.content.toLowerCase().includes(q) ||
                    n.author.name.toLowerCase().includes(q) ||
                    n.tags.some((t) => t.toLowerCase().includes(q))
            );
        }
        if (filters.tags.length > 0) {
            result = result.filter((n) => filters.tags.every((ft) => n.tags.includes(ft)));
        }
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case "newest": return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
                case "most-liked": return b.engagement.likes - a.engagement.likes;
                case "most-restacked": return b.engagement.restacks - a.engagement.restacks;
                case "most-commented": return b.engagement.comments - a.engagement.comments;
                case "total-engagement":
                    return (b.engagement.likes + b.engagement.restacks + b.engagement.comments) -
                        (a.engagement.likes + a.engagement.restacks + a.engagement.comments);
                default: return 0;
            }
        });
        return result;
    }, [notes, filters]);

    const allTags = useMemo(() => {
        const s = new Set<string>();
        notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
        return Array.from(s).sort();
    }, [notes]);

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
                    <p className="text-gray-400">Hot notes with high engagement to inspire your content</p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-4 mb-6">
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
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as SortOption })}
                                className="px-3 py-1.5 bg-[#1e1f21] border border-gray-700 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        {allTags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500">Tags:</span>
                                {allTags.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                tags: prev.tags.includes(tag)
                                                    ? prev.tags.filter((t) => t !== tag)
                                                    : [...prev.tags, tag],
                                            }))
                                        }
                                        className={`px-2 py-1 text-xs rounded-full transition-colors ${filters.tags.includes(tag) ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                        <span className="ml-auto text-sm text-gray-500">
                            {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? "note" : "notes"}
                        </span>
                    </div>
                </div>

                {/* Notes Grid */}
                {filteredAndSortedNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedNotes.map((note) => (
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
                                : "Start saving hot notes from Substack using the Chrome extension."}
                        </p>
                        {notes.length === 0 && (
                            <div className="bg-primary/5 border border-primary/5 rounded-lg p-4 max-w-md mx-auto text-left">
                                <p className="text-primary text-sm mb-2">Install the official Chrome Extension</p>
                                <p className="text-primary/50 text-xs">
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