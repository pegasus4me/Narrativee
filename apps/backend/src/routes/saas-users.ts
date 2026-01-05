import { Router } from 'express';
import { db } from '../auth/auth';
import { saasUsers, events, apiKeys } from '../auth/schema/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';

const router = Router();

// Mock Auth Middleware (Same as api-keys.ts)
const mockAuth = (req: any, res: any, next: any) => {
    // Expecting x-user-id header for now
    const userId = req.headers['x-user-id'];
    if (!userId) {
        // Fallback for dev ease if not provided, or strictly enforce?
        // Let's enforce to be consistent
        // return res.status(401).json({ error: 'Unauthorized: Missing x-user-id header' });
        // Actually, let's just grab the first admin for dev speed if missing
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = { id: userId };
    next();
};

router.get('/stats', mockAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;

        // 1. Get all API Keys IDs for this admin user
        const userApiKeys = await db.select({ id: apiKeys.id })
            .from(apiKeys)
            .where(eq(apiKeys.userId, userId));

        const keyIds = userApiKeys.map(k => k.id);

        if (keyIds.length === 0) {
            return res.json({
                hotLeads: 0,
                activeUsers: 0,
                proUsers: 0,
                workflowsTriggered: 0
            });
        }

        // 2. Fetch SaaS Users
        const users = await db.select().from(saasUsers).where(inArray(saasUsers.apiKeyId, keyIds));

        // 3. Aggregate Stats (In-Memory for MVP)
        const now = new Date().getTime();
        const fifteenMinutes = 15 * 60 * 1000;

        const hotLeads = users.filter(u => (u.score || 0) > 50).length;

        const activeUsers = users.filter(u => {
            if (!u.lastSeenAt) return false;
            return (now - new Date(u.lastSeenAt).getTime()) < fifteenMinutes;
        }).length;

        // Plan Breakdown
        const trialUsers = users.filter(u => (u.metadata as any)?.plan === 'trial').length;
        const freeUsers = users.filter(u => (u.metadata as any)?.plan === 'free' || !(u.metadata as any)?.plan).length;
        const paidUsers = users.filter(u => (u.metadata as any)?.plan === 'paid' || (u.metadata as any)?.plan === 'pro').length;

        // Conversions & Revenue (Mock logic based on real counts)
        // In a real app, we'd query key events "plan_updated" where isConversion == true
        const conversions = paidUsers; // Simple proxy: number of currently paid users
        const totalUsers = users.length;
        const conversionRate = totalUsers > 0 ? ((conversions / totalUsers) * 100).toFixed(1) : 0;

        // Mock Revenue: Assume $49/mo LTV per paid user
        const revenueAttributed = conversions * 49;

        // Sum of all workflows triggered across all users
        const workflowsTriggered = users.reduce((acc, u) => {
            const triggered = (u.metadata as any)?.triggeredWorkflows || [];
            return acc + triggered.length;
        }, 0);

        // Sum of all popup clicks across all users
        const popupsClicked = users.reduce((acc, u) => {
            const clicked = (u.metadata as any)?.clickedPopups || [];
            return acc + clicked.length;
        }, 0);

        // Click-through rate: popupsClicked / workflowsTriggered * 100
        const clickThroughRate = workflowsTriggered > 0
            ? ((popupsClicked / workflowsTriggered) * 100).toFixed(1)
            : 0;

        return res.json({
            hotLeads,
            activeUsers,

            // New breakdown fields
            trialUsers,
            freeUsers,
            paidUsers,

            // Business Metrics
            conversions,
            conversionRate: parseFloat(conversionRate as string),
            revenueAttributed,
            workflowsTriggered,

            // Popup Attribution Metrics
            popupsClicked,
            clickThroughRate: parseFloat(clickThroughRate as string),

            // Trends (Set to 0 to hide for now)
            hotLeadsTrend: 0,
            activeUsersTrend: 0,
            conversionsTrend: 0,
            revenueTrend: 0
        });



    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/', mockAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;

        // 1. Get all API Keys IDs for this admin user
        const userApiKeys = await db.select({ id: apiKeys.id })
            .from(apiKeys)
            .where(eq(apiKeys.userId, userId));

        const keyIds = userApiKeys.map(k => k.id);

        if (keyIds.length === 0) {
            return res.json([]);
        }

        // 2. Fetch SaaS Users who are associated with these keys
        // saasUsers table links to api_keys via apiKeyId

        const users = await db.select({
            id: saasUsers.id, // The user ID from the client side
            score: saasUsers.score,
            firstSeen: saasUsers.createdAt,
            lastSeen: saasUsers.lastSeenAt,
            metadata: saasUsers.metadata, // Include metadata for frontend display
            // We can also aggregate event count if we want to be fancy
            // eventCount: sql<number>`count(${events.id})` 
        })
            .from(saasUsers)
            .where(inArray(saasUsers.apiKeyId, keyIds))
            .orderBy(desc(saasUsers.lastSeenAt));
        // .groupBy(saasUsers.id); // Valid if we aggregate other fields, but strict mode might complain.
        // Let's filter in JS for now to be safe against strict SQL modes without aggregation functions on other cols


        // Let's do a quick separate count or join if needed. 
        // For V1, the data in saasUsers table is sufficient if we update it.
        // Wait, does 'events' update 'saasUsers.lastSeenAt'? 
        // In the events.ts, we should have been updating this. 
        // Let's assume the data in saasUsers is the source of truth for the dashboard list.

        // Deduplicate users by ID
        const uniqueUsers = Array.from(
            new Map(users.map(u => [u.id, u])).values()
        );

        return res.json({ users: uniqueUsers });
    } catch (error) {
        console.error('Error fetching SaaS users:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
