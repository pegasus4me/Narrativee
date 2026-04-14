"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, UserPlus, X, ListFilter, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface WatchlistMember {
    id: string;
    handle: string;
    name: string | null;
}

interface Watchlist {
    id: string;
    name: string;
    members: WatchlistMember[];
}

interface WatchlistPanelProps {
    onFetchWatchlist: (handles: string[], listName: string) => void;
    isFetching: boolean;
}

export function WatchlistPanel({ onFetchWatchlist, isFetching }: WatchlistPanelProps) {
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Create list state
    const [showCreate, setShowCreate] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [creating, setCreating] = useState(false);

    // Add member state
    const [addingToId, setAddingToId] = useState<string | null>(null);
    const [newHandle, setNewHandle] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    useEffect(() => {
        fetchWatchlists();
    }, []);

    async function fetchWatchlists() {
        try {
            const res = await fetch(`${API_URL}/watchlists`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json() as { watchlists: Watchlist[] };
                setWatchlists(data.watchlists);
                if (data.watchlists.length > 0 && !expandedId) {
                    setExpandedId(data.watchlists[0]!.id);
                }
            }
        } catch (e) {
            console.error("[Watchlist] fetch error:", e);
        } finally {
            setLoading(false);
        }
    }

    async function createList() {
        if (!newListName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/watchlists`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newListName.trim() }),
            });
            if (res.ok) {
                const data = await res.json() as { watchlist: Watchlist };
                setWatchlists(prev => [...prev, data.watchlist]);
                setExpandedId(data.watchlist.id);
                setNewListName("");
                setShowCreate(false);
            }
        } finally {
            setCreating(false);
        }
    }

    async function deleteList(id: string) {
        await fetch(`${API_URL}/watchlists/${id}`, { method: "DELETE", credentials: "include" });
        setWatchlists(prev => prev.filter(w => w.id !== id));
        if (expandedId === id) setExpandedId(null);
    }

    async function addMember(watchlistId: string) {
        const handle = newHandle.trim().replace(/^@/, "");
        if (!handle) return;
        setAddingMember(true);
        try {
            const res = await fetch(`${API_URL}/watchlists/${watchlistId}/members`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle }),
            });
            if (res.ok) {
                const data = await res.json() as { member: WatchlistMember };
                setWatchlists(prev => prev.map(w =>
                    w.id === watchlistId ? { ...w, members: [...w.members, data.member] } : w
                ));
                setNewHandle("");
                setAddingToId(null);
            }
        } finally {
            setAddingMember(false);
        }
    }

    async function removeMember(watchlistId: string, memberId: string) {
        await fetch(`${API_URL}/watchlists/${watchlistId}/members/${memberId}`, {
            method: "DELETE",
            credentials: "include",
        });
        setWatchlists(prev => prev.map(w =>
            w.id === watchlistId ? { ...w, members: w.members.filter(m => m.id !== memberId) } : w
        ));
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-3 text-gray-600 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading lists...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <ListFilter className="w-3.5 h-3.5" />
                    Creator Lists
                </div>
                <button
                    onClick={() => setShowCreate(v => !v)}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New list
                </button>
            </div>

            {/* Create list form */}
            {showCreate && (
                <div className="flex items-center gap-1.5">
                    <input
                        autoFocus
                        type="text"
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") createList(); if (e.key === "Escape") setShowCreate(false); }}
                        placeholder="List name..."
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                        onClick={createList}
                        disabled={creating || !newListName.trim()}
                        className="px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 text-violet-400 text-xs font-medium rounded-lg transition-all disabled:opacity-40"
                    >
                        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
                    </button>
                    <button onClick={() => setShowCreate(false)} className="text-gray-600 hover:text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Empty state */}
            {watchlists.length === 0 && !showCreate && (
                <p className="text-xs text-gray-600 px-1">No lists yet. Create one to track specific creators.</p>
            )}

            {/* Watchlist rows */}
            {watchlists.map(list => {
                const isExpanded = expandedId === list.id;
                return (
                    <div key={list.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                        {/* List header */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : list.id)}
                                className="flex items-center gap-2 flex-1 text-left"
                            >
                                {isExpanded
                                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                    : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                }
                                <span className="text-sm text-gray-200 font-medium truncate">{list.name}</span>
                                <span className="text-xs text-gray-600 shrink-0">{list.members.length}</span>
                            </button>

                            {/* Pull notes for this list */}
                            <button
                                onClick={() => onFetchWatchlist(list.members.map(m => m.handle), list.name)}
                                disabled={isFetching || list.members.length === 0}
                                title={list.members.length === 0 ? "Add creators first" : `Pull notes from ${list.name}`}
                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg transition-all disabled:opacity-30 shrink-0"
                            >
                                {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pull notes"}
                            </button>

                            <button
                                onClick={() => deleteList(list.id)}
                                className="text-gray-700 hover:text-red-400 transition-colors shrink-0"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Expanded: members + add form */}
                        {isExpanded && (
                            <div className="border-t border-white/[0.05] px-3 py-2.5 flex flex-col gap-1.5">
                                {list.members.map(m => (
                                    <div key={m.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-gray-500 font-medium uppercase">
                                                {m.handle[0]}
                                            </div>
                                            <span className="text-xs text-gray-400">@{m.handle}</span>
                                            {m.name && <span className="text-xs text-gray-600">{m.name}</span>}
                                        </div>
                                        <button
                                            onClick={() => removeMember(list.id, m.id)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add member inline */}
                                {addingToId === list.id ? (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-gray-600 text-sm">@</span>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newHandle}
                                            onChange={e => setNewHandle(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter") addMember(list.id); if (e.key === "Escape") { setAddingToId(null); setNewHandle(""); } }}
                                            placeholder="handle"
                                            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
                                        />
                                        <button
                                            onClick={() => addMember(list.id)}
                                            disabled={addingMember || !newHandle.trim()}
                                            className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg disabled:opacity-40 hover:bg-blue-500/20 transition-all"
                                        >
                                            {addingMember ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                                        </button>
                                        <button onClick={() => { setAddingToId(null); setNewHandle(""); }} className="text-gray-600 hover:text-gray-400">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingToId(list.id)}
                                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mt-0.5"
                                    >
                                        <UserPlus className="w-3 h-3" /> Add creator
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
