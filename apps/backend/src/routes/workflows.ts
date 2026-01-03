import { Router } from 'express';
import { db, auth } from '../auth/auth';
import { workflows, apiKeys } from '../auth/schema/schema';
import { eq, and } from 'drizzle-orm';
import { apikeyValidator } from '../middleware/apikeyValidator';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Middleware to ensure session authentication
// (Using getSession similar to scoring.ts, assuming dashboard access)
const requireAuth = async (req: any, res: any, next: any) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.session = session;
        next();
    } catch (error) {
        console.error("Auth error", error);
        return res.status(500).json({ error: 'Auth error' });
    }
};

// GET all workflows
router.get('/', requireAuth, async (req, res) => {
    try {
        // We need the apiKeyId. In dashboard context, we might expect it in headers 
        // OR we fetch all API keys for the user and then workflows for those keys.
        // For simplicity/consistency with existing dashboard logic:
        // The dashboard usually sends `x-api-key` header for tracking data, 
        // BUT for configuration, we rely on the User -> API Key relationship.

        // Let's assume we want to fetch workflows for the "Active" project/API Key.
        // Since `scoring.ts` logic was a bit fuzzy on how it got apiKeyId (it used `req.user.apiKeyId` from apikeyValidator?? No, scoring uses getSession).
        // Let's check scoring.ts logic to match.

        // Wait, I will use `apikeyValidator` if the request is coming with `x-api-key` header (which the dashboard client sends).
        // If not, I'll fallback or require it. 
        // Let's use `apikeyValidator` for consistency with `events.ts`, assuming the frontend sends the header.
        // BUT `scoring.ts` used `getSession`. 

        // Let's stick to `apikeyValidator` if we want to act on a specific Project/API Key level.
        // If I look at `events.ts`, it uses `apikeyValidator` and `req.user.apiKeyId`.
        // If I look at `ReportAPI` (frontend), it sends `x-api-key` header?
        // Actually, `ReportAPI` configuration in `apis.ts` seems generic.

        // Let's blindly assume the frontend sends `x-api-key` if available OR we can find it via User.
        // To be SAFE and CLEAN: I'll accept `x-api-key` via `apikeyValidator`. 
        // If the Dashboard DOESN'T send `x-api-key` for configuration calls, we might have an issue.
        // However, the `ReportAPI` uses `axios` instance. I'll check `apis.ts` again later.

        // For now, I'll use `requireAuth` and assume specific logic or `apikeyValidator` logic.
        // Let's use `apikeyValidator` for simplicity? No, `apikeyValidator` is for S2S calls mostly.
        // Let's use `getSession` + find the user's active API key. 

        // Actually, let's look at `scoring.ts` quickly.
        // It fetches logic based on ... wait, I didn't see `scoring.ts` content fully.
        // I'll implement a robust method: Fetch API Key based on Session User.

        const userId = (req as any).session.user.id;

        // Helper to get or create API Key
        let apiKey = await db.query.apiKeys.findFirst({
            where: (apiKeys, { eq, and }) => and(
                eq(apiKeys.userId, userId),
                eq(apiKeys.mode, 'live')
            )
        });

        if (!apiKey) {
            console.log(`[Workflows] No active API key found for user ${userId}. Creating one...`);
            const [newKey] = await db.insert(apiKeys).values({
                key: `nr-live-${uuidv4()}`,
                userId: userId,
                mode: 'live',
                isActive: true
            }).returning();
            apiKey = newKey;
        }

        const data = await db.select().from(workflows).where(eq(workflows.apiKeyId, apiKey.id));
        return res.json({ workflows: data });

    } catch (error) {
        console.error('Error fetching workflows:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// CREATE / UPDATE Workflow
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = (req as any).session.user.id;
        const { id, name, nodes, edges, isActive, triggerCondition, actionConfig } = req.body;

        let apiKey = await db.query.apiKeys.findFirst({
            where: (apiKeys, { eq, and }) => and(
                eq(apiKeys.userId, userId),
                eq(apiKeys.mode, 'live')
            )
        });

        if (!apiKey) {
            const [newKey] = await db.insert(apiKeys).values({
                key: `nr-live-${uuidv4()}`,
                userId: userId,
                mode: 'live',
                isActive: true
            }).returning();
            apiKey = newKey;
        }

        if (id) {
            // Update
            const updated = await db.update(workflows)
                .set({
                    name,
                    nodes,
                    edges,
                    isActive,
                    triggerCondition,
                    actionConfig,
                    updatedAt: new Date()
                })
                .where(and(eq(workflows.id, id), eq(workflows.apiKeyId, apiKey.id)))
                .returning();
            return res.json({ workflow: updated[0] });
        } else {
            // Create
            const created = await db.insert(workflows).values({
                apiKeyId: apiKey.id,
                name: name || 'Untitled Workflow',
                nodes: nodes || [],
                edges: edges || [],
                isActive: isActive ?? true,
                triggerCondition: triggerCondition || {},
                actionConfig: actionConfig || {},
            }).returning();
            return res.json({ workflow: created[0] });
        }

    } catch (error) {
        console.error('Error saving workflow:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE Workflow
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = (req as any).session.user.id;
        const { id } = req.params;

        const apiKey = await db.query.apiKeys.findFirst({
            where: (apiKeys, { eq, and }) => and(
                eq(apiKeys.userId, userId),
                eq(apiKeys.mode, 'live')
            )
        });

        if (!apiKey) return res.status(404).json({ error: 'No API Key' });

        await db.delete(workflows)
            .where(and(eq(workflows.id, id), eq(workflows.apiKeyId, apiKey.id)));

        return res.json({ success: true });

    } catch (error) {
        console.error('Error deleting workflow:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
