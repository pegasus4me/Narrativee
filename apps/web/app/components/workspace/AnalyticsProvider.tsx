"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { PostsAPI, NotesAPI, Stats, NoteStats, Post, Note } from "@/lib/api/posts";
import { API_URL } from "@/lib/api-config";
import type { ReaderFeedNote } from "@/app/actions/agent";

/* ─── Session-level cache for Substack reader feed ──────────────── */
// Stored on globalThis so it survives HMR in dev and React Strict Mode
// double-mounts. Cleared only on hard page reload.
type FeedCacheEntry = {
    heatmap: { date: string; count: number }[];
    notes: ReaderFeedNote[];
    totalLikes: number;
    totalComments: number;
    totalRestacks: number;
};
const g = globalThis as unknown as { __readerFeedCache?: Map<string, FeedCacheEntry> };
if (!g.__readerFeedCache) g.__readerFeedCache = new Map();
const readerFeedCache = g.__readerFeedCache;

/* ─── Client-side reader feed fetch (needs browser cookies) ──────── */

async function fetchReaderFeedClient(handle: string, apiUrl: string): Promise<{
    heatmap: { date: string; count: number }[];
    notes: ReaderFeedNote[];
    totalLikes: number;
    totalComments: number;
    totalRestacks: number;
}> {
    const empty = { heatmap: [], notes: [], totalLikes: 0, totalComments: 0, totalRestacks: 0 };
    if (!handle) return empty;

    const cleanHandle = handle.replace(/^@/, "").replace(/^https?:\/\/substack\.com\/@?/, "").split("/")[0]!;

    // Return cached result if available — avoids inconsistent numbers across refreshes
    const cached = readerFeedCache.get(cleanHandle);
    if (cached) {
        console.log(`[ReaderFeed] cache hit for ${cleanHandle} — ${cached.notes.length} notes, ${cached.totalLikes} likes`);
        return cached;
    }

    // Resolve user ID via backend proxy (avoids CORS on the public profile endpoint)
    const idRes = await fetch(`${apiUrl}/substack/user-id/${cleanHandle}`, { credentials: "include" });
    if (!idRes.ok) {
        console.error(`[ReaderFeed] user-id resolve failed: HTTP ${idRes.status}`);
        return empty;
    }
    const { id: userId } = await idRes.json() as { id: number | null };
    if (!userId) {
        console.error("[ReaderFeed] user-id resolved to null");
        return empty;
    }
    console.log(`[ReaderFeed] resolved ${cleanHandle} → userId ${userId}`);

    const allNotes: ReaderFeedNote[] = [];
    let cursor: string | undefined;

    // Fetch via backend proxy (avoids CORS). The Substack profile feed API
    // is public and doesn't need Substack cookies — it returns all notes for
    // the given userId. The backend proxies to avoid browser CORS restrictions.
    for (let page = 0; page < 20; page++) {
        const url = `${apiUrl}/substack/reader-feed/${userId}${cursor ? `?cursor=${cursor}` : ""}`;
        try {
            const res = await fetch(url, {
                credentials: "include",
                cache: "no-store",
            });
            if (!res.ok) break;

            const data = await res.json() as any;
            const items: any[] = data?.items ?? [];
            if (items.length === 0) break;

            for (const item of items) {
                if (item.comment?.handle !== cleanHandle) continue;
                if (item.comment?.ancestor_path !== "") continue;
                if (item.type !== "comment") continue;
                if (item.context?.type !== "note" && item.comment?.type !== "feed") continue;

                const timestamp: string = item.comment?.date ?? item.context?.timestamp ?? "";
                if (!timestamp) continue;
                const d = new Date(timestamp);
                if (isNaN(d.getTime())) continue;

                allNotes.push({
                    date: d.toISOString().split("T")[0]!,
                    likes: item.comment?.reaction_count ?? 0,
                    comments: item.comment?.children_count ?? 0,
                    restacks: item.comment?.restacks ?? 0,
                    hour: d.getUTCHours(),
                    dayOfWeek: d.getUTCDay(),
                });
            }

            cursor = data?.nextCursor ?? data?.cursor;
            if (!cursor) break;
        } catch (e) {
            console.error("[ReaderFeed] page error:", e);
            break;
        }
    }

    console.log(`[ReaderFeed] fetched ${allNotes.length} notes across all pages`);

    const dateCounts = new Map<string, number>();
    for (const n of allNotes) {
        dateCounts.set(n.date, (dateCounts.get(n.date) ?? 0) + 1);
    }
    const heatmap = Array.from(dateCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const result = {
        heatmap,
        notes: allNotes,
        totalLikes: allNotes.reduce((s, n) => s + n.likes, 0),
        totalComments: allNotes.reduce((s, n) => s + n.comments, 0),
        totalRestacks: allNotes.reduce((s, n) => s + n.restacks, 0),
    };

    console.log(`[ReaderFeed] totals — likes: ${result.totalLikes}, comments: ${result.totalComments}, restacks: ${result.totalRestacks}`);
    readerFeedCache.set(cleanHandle, result);
    return result;
}

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

interface PublishSummary {
    appSubscribers: number;
    appSubscribersLast30Days: number;
    totalEmail: number;
    totalEmailLast30Days: number;
    views: number;
    viewsDelta: number;
    openRate: number;
    openRateDiff: number;
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
    // Publication dashboard summary
    publishSummary: PublishSummary | null;
    // Daily subscriber timeseries from Substack [date, count][]
    subsTimeseries: [string, number][];
    // Paid subscriber timeseries [date, paid, trials, total][]
    paidSubsTimeseries: [string, number, number, number | null][];

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
    const [publishSummary, setPublishSummary] = useState<PublishSummary | null>(null);
    const [subsTimeseries, setSubsTimeseries] = useState<[string, number][]>([]);
    const [paidSubsTimeseries, setPaidSubsTimeseries] = useState<[string, number, number, number | null][]>([]);
    const [loading, setLoading] = useState(true);
    const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

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
            const substackPublicationUrl = onboarding?.substackPublicationUrl || "";

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
                // Publication dashboard summary
                publishSummaryRes,
                // Subscriber timeseries (email total)
                subsTimeseriesRes,
                // Paid subscriber timeseries
                paidSubsTimeseriesRes,
            ] = await Promise.all([
                PostsAPI.getPosts().catch((e) => { console.error("[Analytics] posts error:", e); return []; }),
                NotesAPI.getNotes().catch((e) => { console.error("[Analytics] notes error:", e); return []; }),
                PostsAPI.getStats().catch((e) => { console.error("[Analytics] postStats error:", e); return null; }),
                NotesAPI.getNoteStats().catch((e) => { console.error("[Analytics] noteStats error:", e); return null; }),
                safeFetch(`${API_URL}/subscribers`, "subscribers"),
                safeFetch(`${API_URL}/notes/performance-over-time`, "performance"),
                safeFetch(`${API_URL}/notes/posting-heatmap`, "posting-heatmap"),
                // Fetch notes from Substack reader feed API (client-side, needs browser cookies)
                substackHandle
                    ? fetchReaderFeedClient(substackHandle, API_URL).catch((e) => {
                        console.error("[Analytics] reader feed error:", e);
                        return { heatmap: [], notes: [], totalLikes: 0, totalComments: 0, totalRestacks: 0 };
                    })
                    : Promise.resolve({ heatmap: [], notes: [], totalLikes: 0, totalComments: 0, totalRestacks: 0 }),
                // Fetch cached publication dashboard summary from backend
                fetch(`${API_URL}/substack/publish-summary`, { credentials: "include" })
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null),
                // Fetch cached subscriber timeseries from backend
                fetch(`${API_URL}/substack/subs-timeseries`, { credentials: "include" })
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null),
                // Fetch cached paid subscriber timeseries from backend
                fetch(`${API_URL}/substack/paid-subs-timeseries`, { credentials: "include" })
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null),
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
            if (publishSummaryRes) setPublishSummary(publishSummaryRes as PublishSummary);
            if (Array.isArray(subsTimeseriesRes)) setSubsTimeseries(subsTimeseriesRes as [string, number][]);
            // Skip the header row (index 0 is ["Date","Paid","Free trials","Total subscribers"])
            if (Array.isArray(paidSubsTimeseriesRes) && paidSubsTimeseriesRes.length > 1) {
                setPaidSubsTimeseries(paidSubsTimeseriesRes.slice(1) as [string, number, number, number | null][]);
            }
            setLastFetchedAt(new Date());
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load — guard against React Strict Mode double-mount
    const didFetch = useRef(false);
    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;
        fetchAll();
    }, [fetchAll]);

    // Ask the Chrome extension to fetch publish summary (it has Substack cookies)
    useEffect(() => {
        if (!onboardingData?.substackPublicationUrl) return;

        const pubUrl = onboardingData.substackPublicationUrl;
        console.log("[Analytics] Requesting extension data for:", pubUrl);

        window.postMessage({ type: "NARRATIVEE_FETCH_PUBLISH_SUMMARY", publicationUrl: pubUrl }, "*");
        window.postMessage({ type: "NARRATIVEE_FETCH_SUBS_TIMESERIES", publicationUrl: pubUrl }, "*");
        window.postMessage({ type: "NARRATIVEE_FETCH_PAID_SUBS_TIMESERIES", publicationUrl: pubUrl }, "*");

        const handler = (event: MessageEvent) => {
            if (event.data?.type === "NARRATIVEE_PUBLISH_SUMMARY_RESULT") {
                console.log("[Analytics] Publish summary from extension:", event.data);
                if (event.data.success && event.data.data) {
                    setPublishSummary(event.data.data as PublishSummary);
                }
            }
            if (event.data?.type === "NARRATIVEE_SUBS_TIMESERIES_RESULT") {
                console.log("[Analytics] Subs timeseries from extension:", event.data);
                if (event.data.success && Array.isArray(event.data.data)) {
                    setSubsTimeseries(event.data.data as [string, number][]);
                }
            }
            if (event.data?.type === "NARRATIVEE_PAID_SUBS_TIMESERIES_RESULT") {
                console.log("[Analytics] Paid subs timeseries from extension:", event.data);
                if (event.data.success && Array.isArray(event.data.data) && event.data.data.length > 1) {
                    setPaidSubsTimeseries(event.data.data.slice(1) as [string, number, number, number | null][]);
                }
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [onboardingData?.substackPublicationUrl]);

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
                publishSummary,
                subsTimeseries,
                paidSubsTimeseries,
                loading,
                lastFetchedAt,
                refresh: fetchAll,
            }}
        >
            {children}
        </AnalyticsContext.Provider>
    );
}
