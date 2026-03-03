
import { db } from "../auth/auth";
import { posts, user } from "../auth/schema/schema";
import { eq, desc, sql } from "drizzle-orm";

interface PostData {
    substackId?: string;
    title: string;
    url: string;
    slug?: string;
    publishedAt?: Date;
    views?: number;
    openRate?: number;
    likes?: number;
    comments?: number;
    shares?: number;
}

export const PostService = {
    /**
     * Sync posts from Extension data
     */
    async syncPostsFromExtension(userId: string, postsData: PostData[]) {
        console.log(`Syncing ${postsData.length} posts for user ${userId}`);

        for (const post of postsData) {
            // Try to find existing post by URL or Substack ID
            let existing = null;

            if (post.substackId) {
                existing = await db.query.posts.findFirst({
                    where: eq(posts.substackId, post.substackId)
                });
            }

            if (!existing && post.url) {
                existing = await db.query.posts.findFirst({
                    where: eq(posts.url, post.url)
                });
            }

            if (existing) {
                // Update
                if (existing.userId !== userId) {
                    console.warn(`Post ${post.url} belongs to another user (existing: ${existing.userId}, new: ${userId})`);
                    continue; // Security check
                }

                await db.update(posts).set({
                    ...post,
                    lastSyncedAt: new Date(),
                    updatedAt: new Date()
                }).where(eq(posts.id, existing.id));
            } else {
                // Insert
                await db.insert(posts).values({
                    userId,
                    ...post,
                    lastSyncedAt: new Date()
                });
            }
        }

        return { success: true, count: postsData.length };
    },

    /**
     * Get all posts for a user
     */
    async getPosts(userId: string) {
        return await db.query.posts.findMany({
            where: eq(posts.userId, userId),
            orderBy: [desc(posts.publishedAt)]
        });
    },

    /**
     * Get aggregated stats
     */
    async getStats(userId: string) {
        const result = await db
            .select({
                totalViews: sql<number>`sum(${posts.views})`,
                totalLikes: sql<number>`sum(${posts.likes})`,
                totalComments: sql<number>`sum(${posts.comments})`,
                avgOpenRate: sql<number>`avg(${posts.openRate})`,
                postCount: sql<number>`count(${posts.id})`
            })
            .from(posts)
            .where(eq(posts.userId, userId));

        const stats = result[0];

        return {
            totalViews: Number(stats.totalViews || 0),
            totalLikes: Number(stats.totalLikes || 0),
            totalComments: Number(stats.totalComments || 0),
            avgOpenRate: Math.round(Number(stats.avgOpenRate || 0)),
            postCount: Number(stats.postCount || 0)
        };
    }
};
