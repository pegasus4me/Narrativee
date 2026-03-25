import { db } from "../auth/auth";
import { scheduledNotes } from "../auth/schema/schema";
import { eq, and, desc } from "drizzle-orm";

interface ScheduledNoteData {
    id: string;
    content: string;
    scheduledDate: string;
    scheduledTime?: string;
    scheduledTimestamp?: number | string; // UTC ms
    timezone?: string;           // e.g. "Europe/Paris"
    status?: string;
}

export const ScheduledNoteService = {
    async getAll(userId: string) {
        return await db.query.scheduledNotes.findMany({
            where: eq(scheduledNotes.userId, userId),
            orderBy: [desc(scheduledNotes.scheduledDate)],
        });
    },

    async upsert(userId: string, data: ScheduledNoteData) {
        const existing = await db.query.scheduledNotes.findFirst({
            where: and(
                eq(scheduledNotes.id, data.id),
                eq(scheduledNotes.userId, userId)
            ),
        });

        if (existing) {
            await db.update(scheduledNotes).set({
                content: data.content,
                scheduledDate: data.scheduledDate,
                scheduledTime: data.scheduledTime ?? null,
                scheduledTimestamp: data.scheduledTimestamp != null ? String(data.scheduledTimestamp) : null,
                timezone: data.timezone ?? null,
                status: data.status ?? existing.status,
                updatedAt: new Date(),
            }).where(eq(scheduledNotes.id, data.id));
        } else {
            await db.insert(scheduledNotes).values({
                id: data.id,
                userId,
                content: data.content,
                scheduledDate: data.scheduledDate,
                scheduledTime: data.scheduledTime ?? null,
                scheduledTimestamp: data.scheduledTimestamp != null ? String(data.scheduledTimestamp) : null,
                timezone: data.timezone ?? null,
                status: data.status ?? "draft",
            });
        }

        return { success: true, id: data.id };
    },

    async updateStatus(userId: string, noteId: string, status: string) {
        await db.update(scheduledNotes).set({
            status,
            updatedAt: new Date(),
        }).where(and(
            eq(scheduledNotes.id, noteId),
            eq(scheduledNotes.userId, userId)
        ));
        return { success: true };
    },

    async remove(userId: string, noteId: string) {
        const result = await db.delete(scheduledNotes).where(and(
            eq(scheduledNotes.id, noteId),
            eq(scheduledNotes.userId, userId)
        ));
        return { success: true, deleted: (result as any).rowCount ?? 0 };
    },
};
