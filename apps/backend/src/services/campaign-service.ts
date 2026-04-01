import { db } from "../auth/auth";
import { campaigns, campaignTargets } from "../auth/schema/schema";
import { eq, and, desc, sql } from "drizzle-orm";

interface CreateCampaignData {
    name: string;
    replyTemplate: string;
    dailyQuota?: number;
}

interface AddTargetsData {
    parentCommentId: string;
    parentCommentUrl: string;
    parentPostUrl: string;
    parentCommentContent?: string;
    targetAuthorName?: string;
    targetAuthorHandle?: string;
    targetCommentId: string;
    targetCommentContent?: string;
    originalNoteContent?: string;
}

export const CampaignService = {
    async createCampaign(userId: string, data: CreateCampaignData) {
        const [campaign] = await db.insert(campaigns).values({
            userId,
            name: data.name,
            replyTemplate: data.replyTemplate,
            dailyQuota: data.dailyQuota ?? 10,
        }).returning();
        return campaign;
    },

    async getCampaigns(userId: string) {
        return db.query.campaigns.findMany({
            where: eq(campaigns.userId, userId),
            orderBy: [desc(campaigns.createdAt)],
        });
    },

    async getCampaignById(userId: string, campaignId: string) {
        return db.query.campaigns.findFirst({
            where: and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)),
            with: { targets: { orderBy: [desc(campaignTargets.createdAt)] } },
        });
    },

    async updateCampaign(userId: string, campaignId: string, data: Partial<CreateCampaignData & { status: string }>) {
        const [updated] = await db
            .update(campaigns)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
            .returning();
        return updated;
    },

    async deleteCampaign(userId: string, campaignId: string) {
        await db.delete(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    },

    async clearTargets(userId: string, campaignId: string) {
        const campaign = await db.query.campaigns.findFirst({
            where: and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)),
        });
        if (!campaign) throw new Error("Campaign not found");
        const deleted = await db.delete(campaignTargets)
            .where(eq(campaignTargets.campaignId, campaignId))
            .returning({ id: campaignTargets.id });
        return deleted.length;
    },

    async addTargets(userId: string, campaignId: string, targets: AddTargetsData[]) {
        // Verify campaign belongs to user
        const campaign = await db.query.campaigns.findFirst({
            where: and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)),
        });
        if (!campaign) throw new Error("Campaign not found");

        // Deduplicate: skip targets whose targetCommentId already exists in this campaign
        const existingTargets = await db.query.campaignTargets.findMany({
            where: eq(campaignTargets.campaignId, campaignId),
        });
        const existingIds = new Set(existingTargets.map(t => t.targetCommentId));
        const newTargets = targets.filter(t => !existingIds.has(t.targetCommentId));

        if (newTargets.length === 0) return [];

        return db.insert(campaignTargets).values(
            newTargets.map(t => ({ ...t, campaignId, userId }))
        ).returning();
    },

    async getNextPendingTarget(campaignId: string) {
        return db.query.campaignTargets.findFirst({
            where: and(
                eq(campaignTargets.campaignId, campaignId),
                eq(campaignTargets.status, "pending")
            ),
            orderBy: [desc(campaignTargets.createdAt)],
        });
    },

    async markTargetReplied(targetId: string, replyCommentId: string, replyText?: string) {
        await db
            .update(campaignTargets)
            .set({ status: "replied", repliedAt: new Date(), replyCommentId, replyText: replyText || null, updatedAt: new Date() })
            .where(eq(campaignTargets.id, targetId));
    },

    async markTargetSkipped(targetId: string) {
        await db
            .update(campaignTargets)
            .set({ status: "skipped", updatedAt: new Date() })
            .where(eq(campaignTargets.id, targetId));
    },

    async markTargetPending(targetId: string) {
        await db
            .update(campaignTargets)
            .set({ status: "pending", updatedAt: new Date() })
            .where(eq(campaignTargets.id, targetId));
    },

    async markTargetFailed(targetId: string) {
        await db
            .update(campaignTargets)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(campaignTargets.id, targetId));
    },

    async markTargetRepliedBack(targetId: string) {
        await db
            .update(campaignTargets)
            .set({ targetRepliedBack: true, updatedAt: new Date() })
            .where(eq(campaignTargets.id, targetId));
    },

    async markTargetSubscribed(targetId: string) {
        await db
            .update(campaignTargets)
            .set({ targetSubscribed: true, updatedAt: new Date() })
            .where(eq(campaignTargets.id, targetId));
    },

    async incrementDailyReplies(campaignId: string) {
        // Reset counter if last reset was a different day
        const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, campaignId) });
        if (!campaign) return;

        const now = new Date();
        const lastReset = campaign.lastQuotaResetAt ? new Date(campaign.lastQuotaResetAt) : null;
        const isNewDay = !lastReset || lastReset.toDateString() !== now.toDateString();

        await db
            .update(campaigns)
            .set({
                repliedToday: isNewDay ? 1 : sql`${campaigns.repliedToday} + 1`,
                totalReplies: sql`${campaigns.totalReplies} + 1`,
                lastQuotaResetAt: isNewDay ? now : campaign.lastQuotaResetAt,
                updatedAt: now,
            })
            .where(eq(campaigns.id, campaignId));
    },

    async isQuotaReached(campaignId: string): Promise<boolean> {
        const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, campaignId) });
        if (!campaign) return true;

        const now = new Date();
        const lastReset = campaign.lastQuotaResetAt ? new Date(campaign.lastQuotaResetAt) : null;
        const isNewDay = !lastReset || lastReset.toDateString() !== now.toDateString();

        if (isNewDay) return false;
        return campaign.repliedToday >= campaign.dailyQuota;
    },
};
