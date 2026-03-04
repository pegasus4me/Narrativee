
import { db } from "../auth/auth";
import { notes } from "../auth/schema/schema";
import { eq, desc, sql, isNotNull, and } from "drizzle-orm";

interface NoteData {
    substackNoteId?: string;
    contentPreview?: string;
    url?: string;
    publishedAt?: Date | string;
    likes?: number;
    comments?: number;
    restacks?: number;
}

export const NoteService = {
    /**
     * Sync notes from Extension data (upsert by substackNoteId or url)
     */
    async syncNotesFromExtension(userId: string, notesData: NoteData[]) {
        console.log(`Syncing ${notesData.length} notes for user ${userId}`);

        for (const note of notesData) {
            let existing = null;

            if (note.substackNoteId) {
                existing = await db.query.notes.findFirst({
                    where: eq(notes.substackNoteId, note.substackNoteId)
                });
            }

            if (!existing && note.url) {
                existing = await db.query.notes.findFirst({
                    where: eq(notes.url, note.url)
                });
            }

            const publishedAt = note.publishedAt ? new Date(note.publishedAt) : null;

            if (existing) {
                if (existing.userId !== userId) {
                    console.warn(`Note ${note.url} belongs to another user`);
                    continue;
                }
                await db.update(notes).set({
                    contentPreview: note.contentPreview,
                    likes: note.likes ?? 0,
                    comments: note.comments ?? 0,
                    restacks: note.restacks ?? 0,
                    lastSyncedAt: new Date(),
                    updatedAt: new Date(),
                    ...(publishedAt && { publishedAt })
                }).where(eq(notes.id, existing.id));
            } else {
                await db.insert(notes).values({
                    userId,
                    substackNoteId: note.substackNoteId,
                    contentPreview: note.contentPreview,
                    url: note.url,
                    publishedAt: publishedAt ?? undefined,
                    likes: note.likes ?? 0,
                    comments: note.comments ?? 0,
                    restacks: note.restacks ?? 0,
                    lastSyncedAt: new Date(),
                });
            }
        }

        return { success: true, count: notesData.length };
    },

    /**
     * Get all notes for a user
     */
    async getNotes(userId: string) {
        return await db.query.notes.findMany({
            where: eq(notes.userId, userId),
            orderBy: [desc(notes.publishedAt)]
        });
    },

    /**
     * Get aggregated note stats
     */
    async getNoteStats(userId: string) {
        const result = await db
            .select({
                totalLikes: sql<number>`sum(${notes.likes})`,
                totalComments: sql<number>`sum(${notes.comments})`,
                totalRestacks: sql<number>`sum(${notes.restacks})`,
                noteCount: sql<number>`count(${notes.id})`
            })
            .from(notes)
            .where(eq(notes.userId, userId));

        const stats = result[0];

        return {
            totalLikes: Number(stats.totalLikes || 0),
            totalComments: Number(stats.totalComments || 0),
            totalRestacks: Number(stats.totalRestacks || 0),
            noteCount: Number(stats.noteCount || 0)
        };
    },

    /**
     * Clear all notes for a user
     */
    async clearNotes(userId: string) {
        const result = await db.delete(notes).where(eq(notes.userId, userId));
        return (result as any).rowCount ?? 0;
    },



    /**
     * Hourly engagement breakdown (24 buckets)
     * Groups notes by hour of publishedAt, sums likes+comments+restacks
     */
    async getHourlyActivity(userId: string) {
        const result = await db
            .select({
                hour: sql<number>`EXTRACT(HOUR FROM ${notes.publishedAt})::int`,
                engagement: sql<number>`sum(${notes.likes} + ${notes.comments} + ${notes.restacks})`,
                noteCount: sql<number>`count(${notes.id})`
            })
            .from(notes)
            .where(and(eq(notes.userId, userId), isNotNull(notes.publishedAt)))
            .groupBy(sql`EXTRACT(HOUR FROM ${notes.publishedAt})`)
            .orderBy(sql`EXTRACT(HOUR FROM ${notes.publishedAt})`);

        // Fill all 24 hours (some may have no data)
        const map = new Map(result.map(r => [Number(r.hour), r]));
        return Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
            engagement: Number(map.get(h)?.engagement ?? 0),
            noteCount: Number(map.get(h)?.noteCount ?? 0),
        }));
    },

    /**
     * Performance over time — grouped by ISO week
     */
    async getPerformanceOverTime(userId: string) {
        const result = await db
            .select({
                week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${notes.publishedAt}), 'YYYY-MM-DD')`,
                likes: sql<number>`sum(${notes.likes})`,
                comments: sql<number>`sum(${notes.comments})`,
                restacks: sql<number>`sum(${notes.restacks})`,
                noteCount: sql<number>`count(${notes.id})`
            })
            .from(notes)
            .where(and(eq(notes.userId, userId), isNotNull(notes.publishedAt)))
            .groupBy(sql`DATE_TRUNC('week', ${notes.publishedAt})`)
            .orderBy(sql`DATE_TRUNC('week', ${notes.publishedAt})`);

        return result.map(r => ({
            week: r.week,
            likes: Number(r.likes ?? 0),
            comments: Number(r.comments ?? 0),
            restacks: Number(r.restacks ?? 0),
            noteCount: Number(r.noteCount ?? 0),
        }));
    },

    /**
     * Posting heatmap: dayOfWeek (0=Sun) x hour (0-23) counts
     */
    async getPostingHeatmap(userId: string) {
        const result = await db
            .select({
                dayOfWeek: sql<number>`EXTRACT(DOW FROM ${notes.publishedAt})::int`,
                hour: sql<number>`EXTRACT(HOUR FROM ${notes.publishedAt})::int`,
                count: sql<number>`count(${notes.id})`
            })
            .from(notes)
            .where(and(eq(notes.userId, userId), isNotNull(notes.publishedAt)))
            .groupBy(
                sql`EXTRACT(DOW FROM ${notes.publishedAt})`,
                sql`EXTRACT(HOUR FROM ${notes.publishedAt})`
            );

        return result.map(r => ({
            dayOfWeek: Number(r.dayOfWeek),
            hour: Number(r.hour),
            count: Number(r.count),
        }));
    }
};
