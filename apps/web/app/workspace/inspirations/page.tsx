"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, TrendingUp, Heart, Repeat2, MessageCircle, Sparkles, Loader2, Clock } from "lucide-react";
import InspirationCard from "@/app/components/workspace/InspirationCard";
import { InspirationNote, InspirationFilters, SortOption } from "@/app/types/inspiration";
import { API_URL } from "@/lib/api-config";

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: "newest", label: "Recent", icon: <Clock className="w-3 h-3" /> },
    { value: "total-engagement", label: "Top", icon: <TrendingUp className="w-3 h-3" /> },
    { value: "most-liked", label: "Liked", icon: <Heart className="w-3 h-3" /> },
    { value: "most-restacked", label: "Restacked", icon: <Repeat2 className="w-3 h-3" /> },
    { value: "most-commented", label: "Discussed", icon: <MessageCircle className="w-3 h-3" /> },
];

export default function InspirationsPage() {
    const [notes, setNotes] = useState<InspirationNote[]>([]);
    const [filters, setFilters] = useState<InspirationFilters>({ sortBy: "newest", searchQuery: "", tags: [] });
    const [isLoading, setIsLoading] = useState(true);

    const loadFromBackend = async () => {
        try {
            const res = await fetch(`${API_URL}/inspirations`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json() as any;
                return (data.notes as InspirationNote[]) || [];
            }
        } catch (e) {
            console.error("Failed to load inspirations:", e);
        }
        return [];
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        loadFromBackend().then((backendNotes) => { setNotes(backendNotes); setIsLoading(false); });

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;
            if (event.data?.type === "NARRATIVEE_INSPIRATION_SAVED") {
                const newNote: InspirationNote = event.data.note;
                fetch(`${API_URL}/inspirations`, {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes: [newNote] }),
                }).then((res) => {
                    if (res.ok) setNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
                }).catch(console.error);
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this note from your inspirations?")) return;
        setNotes((prev) => prev.filter((n) => n.id !== id));
        try {
            await fetch(`${API_URL}/inspirations/${id}`, { method: "DELETE", credentials: "include" });
        } catch (e) {
            loadFromBackend().then(setNotes);
        }
    };

    const handleUpdateTags = async (id: string, tags: string[]) => {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, tags } : n)));
        await fetch(`${API_URL}/inspirations/${id}`, {
            method: "PATCH", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags }),
        }).catch(console.error);
    };

    const handleUpdateNotes = async (id: string, personalNotes: string) => {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, notes: personalNotes } : n)));
        await fetch(`${API_URL}/inspirations/${id}`, {
            method: "PATCH", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: personalNotes }),
        }).catch(console.error);
    };

    const handleAddToQueue = (note: InspirationNote) => {
        const post = { id: crypto.randomUUID(), content: note.content, time: "", status: "draft" as const, date: new Date().toISOString().split("T")[0] };
        const existing = JSON.parse(localStorage.getItem("narrativee_scheduler_posts_v3") || "[]");
        localStorage.setItem("narrativee_scheduler_posts_v3", JSON.stringify([...existing, post]));
        alert("Added to Post Queue!");
    };

    const filteredAndSortedNotes = useMemo(() => {
        let result = [...notes];
        if (filters.searchQuery.trim()) {
            const q = filters.searchQuery.toLowerCase();
            result = result.filter(n => n.content.toLowerCase().includes(q) || n.author.name.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)));
        }
        if (filters.tags.length > 0) result = result.filter(n => filters.tags.every(ft => n.tags.includes(ft)));
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case "newest": return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
                case "most-liked": return b.engagement.likes - a.engagement.likes;
                case "most-restacked": return b.engagement.restacks - a.engagement.restacks;
                case "most-commented": return b.engagement.comments - a.engagement.comments;
                case "total-engagement": return (b.engagement.likes + b.engagement.restacks + b.engagement.comments) - (a.engagement.likes + a.engagement.restacks + a.engagement.comments);
                default: return 0;
            }
        });
        return result;
    }, [notes, filters]);

    const allTags = useMemo(() => {
        const s = new Set<string>();
        notes.forEach(n => n.tags.forEach(t => s.add(t)));
        return Array.from(s).sort();
    }, [notes]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-gray-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-100">Inspirations</h1>
                        <p className="text-sm text-gray-500 mt-1">High-engagement notes saved from Substack to inspire your content.</p>
                    </div>
                    {notes.length > 0 && (
                        <span className="text-xs text-gray-600 mt-2">{filteredAndSortedNotes.length} notes</span>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            type="text"
                            value={filters.searchQuery}
                            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                            placeholder="Search notes, authors or tags..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:border-white/20"
                        />
                    </div>

                    {/* Sort + Tags */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-1">
                            {SORT_OPTIONS.map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    onClick={() => setFilters({ ...filters, sortBy: value })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${filters.sortBy === value ? "bg-white/10 text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    {icon} {label}
                                </button>
                            ))}
                        </div>

                        {allTags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setFilters(prev => ({
                                            ...prev,
                                            tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
                                        }))}
                                        className={`px-2.5 py-1 text-xs rounded-full transition-colors font-medium ${filters.tags.includes(tag) ? "bg-violet-900/40 text-violet-300 border border-violet-700/40" : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-gray-300"}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Grid */}
                {filteredAndSortedNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-14 h-14 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-gray-300 font-medium mb-1">
                                {filters.searchQuery || filters.tags.length > 0 ? "No notes match your filters" : "No inspirations yet"}
                            </h3>
                            <p className="text-gray-600 text-sm max-w-xs">
                                {filters.searchQuery || filters.tags.length > 0
                                    ? "Try adjusting your search or tag filters."
                                    : "Save high-engagement notes from Substack using the Chrome extension."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
