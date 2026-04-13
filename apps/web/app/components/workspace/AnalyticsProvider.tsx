"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PostsAPI, NotesAPI, Stats, NoteStats, Post, Note } from "@/lib/api/posts";
import { API_URL } from "@/lib/api-config";
import { authClient } from "@/lib/auth-client";
import { fetchNotesFromReaderFeed, ReaderFeedNote } from "@/app/actions/agent";

/* ─── Types ──────────────────────────────────────────────────────── */

interface SubsPoint {
    month: string;
    freeCount: number;
    paidCount: number;
    totalCount: number;
}

interface PerfPoint {
    week: string;
    likes: number;
    comments: number;
    restacks: number;
    noteCount: number;
}

interface HourlyPoint {
    hour: number;
    label: string;
    engagement: number;
    noteCount: number;
}

interface HeatmapCell {
    date: string;
    count: number;
}

interface AnalyticsData {
    // Raw data
    posts: Post[];
    notes: Note[];
    postStats: Stats | null;
    noteStats: NoteStats | null;
    subscribers: SubsPoint[];
    performance: PerfPoint[];
    hourlyActivity: HourlyPoint[];
    heatmap: HeatmapCell[];
    onboardingData: any;
    // Notes pulled directly from Substack reader feed
    feedNotes: ReaderFeedNote[];
    feedLikes: number;
    feedComments: number;
    feedRestacks: number;

    // State
    loading: boolean;
    lastFetchedAt: Date | null;

    // Actions
    refresh: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsData | null>(null);

export function useAnalytics() {
    const ctx = useContext(AnalyticsContext);
    if (!ctx) throw new Error("useAnalytics must be used within <AnalyticsProvider>");
    return ctx;
}

/* ─── Provider ───────────────────────────────────────────────────── */

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [postStats, setPostStats] = useState<Stats | null>(null);
    const [noteStats, setNoteStats] = useState<NoteStats | null>(null);
    const [subscribers, setSubscribers] = useState<SubsPoint[]>([]);
    const [performance, setPerformance] = useState<PerfPoint[]>([]);
    const [hourlyActivity, setHourlyActivity] = useState<HourlyPoint[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
    const [onboardingData, setOnboardingData] = useState<any>({});
    const [feedNotes, setFeedNotes] = useState<ReaderFeedNote[]>([]);
    const [feedLikes, setFeedLikes] = useState(0);
    const [feedComments, setFeedComments] = useState(0);
    const [feedRestacks, setFeedRestacks] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

    const { data: session } = authClient.useSession();

    const safeFetch = async (url: string, label: string) => {
        try {
            const r = await fetch(url, { credentials: "include" });
            if (!r.ok) {
                console.error(`[Analytics] ${label} failed: HTTP ${r.status}`);
                return [];
            }
            const j = await r.json();
            console.log(`[Analytics] ${label}:`, Array.isArray(j.data) ? `${j.data.length} items` : j.data);
            return j.data || [];
        } catch (e) {
            console.error(`[Analytics] ${label} error:`, e);
            return [];
        }
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            // Step 1: Fetch onboarding data to get the publication URL
            let onboarding: any = {};
            try {
                const res = await fetch(`${API_URL}/onboarding`, { credentials: "include" });
                if (res.ok) {
                    onboarding = await res.json();
                    setOnboardingData(onboarding);
                }
            } catch (e) {
                console.error("[Analytics] onboarding error:", e);
            }

            const substackHandle = onboarding?.substackHandle || onboarding?.substackProfileUrl || "";

            // Step 2: Fetch everything in parallel
            const [
                postsRes,
                notesRes,
                postStatsRes,
                noteStatsRes,
                subsRes,
                perfRes,
                // Heatmap from DB (scheduled notes published via app)
                dbHeatmap,
                // Notes from Substack reader feed API (source of truth for notes)
                feedResult,
            ] = await Promise.all([
                PostsAPI.getPosts().catch((e) => { console.error("[Analytics] posts error:", e); return []; }),
                NotesAPI.getNotes().catch((e) => { console.error("[Analytics] notes error:", e); return []; }),
                PostsAPI.getStats().catch((e) => { console.error("[Analytics] postStats error:", e); return null; }),
                NotesAPI.getNoteStats().catch((e) => { console.error("[Analytics] noteStats error:", e); return null; }),
                safeFetch(`${API_URL}/subscribers`, "subscribers"),
                safeFetch(`${API_URL}/notes/performance-over-time`, "performance"),
                safeFetch(`${API_URL}/notes/posting-heatmap`, "posting-heatmap"),
                // Fetch notes from Substack reader feed API
                substackHandle
                    ? fetchNotesFromReaderFeed(substackHandle).catch((e) => {
                        console.error("[Analytics] reader feed error:", e);
                        return { heatmap: [], notes: [], totalLikes: 0, totalComments: 0, totalRestacks: 0 };
                    })
                    : Promise.resolve({ heatmap: [], notes: [], totalLikes: 0, totalComments: 0, totalRestacks: 0 }),
            ]);

            // Merge heatmap: reader feed (notes) + DB (scheduled notes via app)
            const mergedMap = new Map<string, number>();
            for (const cell of feedResult.heatmap) {
                mergedMap.set(cell.date, (mergedMap.get(cell.date) ?? 0) + cell.count);
            }
            for (const cell of dbHeatmap) {
                mergedMap.set(cell.date, (mergedMap.get(cell.date) ?? 0) + cell.count);
            }
            const mergedHeatmap = Array.from(mergedMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            console.log(`[Analytics] heatmap: ${feedResult.heatmap.length} dates from reader feed + ${dbHeatmap.length} from DB = ${mergedHeatmap.length} total`);

            // Derive hourly activity from feed notes (engagement by hour posted)
            const hourMap = new Map<number, { engagement: number; count: number }>();
            for (const n of feedResult.notes) {
                const eng = n.likes + n.comments * 3 + n.restacks * 5;
                const existing = hourMap.get(n.hour) ?? { engagement: 0, count: 0 };
                hourMap.set(n.hour, { engagement: existing.engagement + eng, count: existing.count + 1 });
            }
            const derivedHourly: HourlyPoint[] = Array.from({ length: 24 }, (_, h) => ({
                hour: h,
                label: `${h.toString().padStart(2, "0")}:00`,
                engagement: hourMap.get(h)?.engagement ?? 0,
                noteCount: hourMap.get(h)?.count ?? 0,
            }));

            setPosts(postsRes);
            setNotes(notesRes);
            setPostStats(postStatsRes);
            setNoteStats(noteStatsRes);
            setSubscribers(subsRes);
            setPerformance(perfRes);
            setHourlyActivity(derivedHourly);
            setHeatmap(mergedHeatmap);
            setFeedNotes(feedResult.notes);
            setFeedLikes(feedResult.totalLikes);
            setFeedComments(feedResult.totalComments);
            setFeedRestacks(feedResult.totalRestacks);
            setLastFetchedAt(new Date());
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return (
        <AnalyticsContext.Provider
            value={{
                posts,
                notes,
                postStats,
                noteStats,
                subscribers,
                performance,
                hourlyActivity,
                heatmap,
                onboardingData,
                feedNotes,
                feedLikes,
                feedComments,
                feedRestacks,
                loading,
                lastFetchedAt,
                refresh: fetchAll,
            }}
        >
            {children}
        </AnalyticsContext.Provider>
    );
}
