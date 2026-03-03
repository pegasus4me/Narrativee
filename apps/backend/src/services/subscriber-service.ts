
import { db } from "../auth/auth";
import { subscribers } from "../auth/schema/schema";
import { eq, desc } from "drizzle-orm";

interface SubsData {
    month: string; // "YYYY-MM"
    freeCount: number;
    paidCount: number;
    totalCount: number;
}

export const SubscriberService = {
    async getSubscribers(userId: string) {
        return await db.query.subscribers.findMany({
            where: eq(subscribers.userId, userId),
            orderBy: [desc(subscribers.month)],
        });
    },

    async syncSubscribers(userId: string, data: SubsData[]) {
        for (const entry of data) {
            const existing = await db.query.subscribers.findFirst({
                where: eq(subscribers.userId, userId),
            });

            // Try to find by userId + month combo
            const rows = await db.query.subscribers.findMany({
                where: eq(subscribers.userId, userId),
            });
            const existingRow = rows.find(r => r.month === entry.month);

            if (existingRow) {
                await db.update(subscribers)
                    .set({
                        freeCount: entry.freeCount,
                        paidCount: entry.paidCount,
                        totalCount: entry.totalCount,
                        updatedAt: new Date(),
                    })
                    .where(eq(subscribers.id, existingRow.id));
            } else {
                await db.insert(subscribers).values({
                    userId,
                    month: entry.month,
                    freeCount: entry.freeCount,
                    paidCount: entry.paidCount,
                    totalCount: entry.totalCount,
                });
            }
        }
        return { success: true, count: data.length };
    },
};
