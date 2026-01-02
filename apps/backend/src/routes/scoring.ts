import { Router } from 'express';
import { db } from '../auth/auth';
import { apiKeys, scoringConfigs } from '../auth/schema/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../auth/auth'; // Import better-auth instance if needed for session, but likely we use a middleware or just check headers?
// Wait, for settings page, we are authenticated via Better-Auth session cookie usually.
// So we should use the session middleware.

const router = Router();

// Middleware to get session user
// We can use the 'users' middleware or similar if we have one, or just use auth.api.getSession
// Let's implement a simple inline check or import one. 
// Assuming index.ts mounts this under /api/scoring and we can use a middleware there or here.
// Let's copy the pattern from 'report.ts' which uses getSession.

import { fromNodeHeaders } from "better-auth/node";

const getSession = async (req: any, res: any, next: any) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    req.session = session;
    next();
};

router.use(getSession);

// GET / - Fetch configs
router.get('/', async (req: any, res) => {
    const userId = req.session.user.id;

    try {
        // 1. Get the user's LIVE API Key
        // TODO: Handle multiple keys or project selection. For now, take the first 'live' key.
        const userApiKey = await db.query.apiKeys.findFirst({
            where: and(
                eq(apiKeys.userId, userId),
                eq(apiKeys.mode, 'live'),
                eq(apiKeys.isActive, true)
            )
        });

        if (!userApiKey) {
            return res.json({ configs: [], message: "No active live API key found" });
        }

        // 2. Fetch configs
        const configs = await db.select()
            .from(scoringConfigs)
            .where(eq(scoringConfigs.apiKeyId, userApiKey.id));

        return res.json({ configs });
    } catch (error) {
        console.error("Error fetching scoring configs:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST / - Add/Update Config
router.post('/', async (req: any, res) => {
    const userId = req.session.user.id;
    const { eventName, scoreValue } = req.body;

    if (!eventName || typeof scoreValue !== 'number') {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        // 1. Get API Key
        const userApiKey = await db.query.apiKeys.findFirst({
            where: and(
                eq(apiKeys.userId, userId),
                eq(apiKeys.mode, 'live'),
                eq(apiKeys.isActive, true)
            )
        });

        if (!userApiKey) {
            return res.status(404).json({ error: "No active live API key found to attach config to" });
        }

        // 2. Insert Config
        // We could enable UPSERT if unique constraint exists on (apiKeyId, eventName).
        // For now, just insert. Ideally schema should have unique constraint.
        // Let's checking existence first to avoid duplicates for now.

        const existing = await db.query.scoringConfigs.findFirst({
            where: and(
                eq(scoringConfigs.apiKeyId, userApiKey.id),
                eq(scoringConfigs.eventName, eventName)
            )
        });

        if (existing) {
            // Update
            await db.update(scoringConfigs)
                .set({ scoreValue })
                .where(eq(scoringConfigs.id, existing.id));
        } else {
            // Create
            await db.insert(scoringConfigs).values({
                apiKeyId: userApiKey.id,
                eventName,
                scoreValue,
            });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error("Error saving scoring config:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE /:id - Delete Config
router.delete('/:id', async (req: any, res) => {
    const userId = req.session.user.id;
    const { id } = req.params;

    try {
        // Verify ownership (join with API Keys -> User)
        // Or just trust ID? No, safer to verify.
        // Actually, let's just delete where ID matches AND valid ownership? 
        // A bit complex with Drizzle in one go without raw SQL or joins.
        // Simple way: Fetch config, check apiKey ownership.

        const config = await db.query.scoringConfigs.findFirst({
            where: eq(scoringConfigs.id, id),
            with: {
                apiKey: true // Need relation
            }
        });

        if (!config || config.apiKey.userId !== userId) {
            return res.status(403).json({ error: "Forbidden or Not Found" });
        }

        await db.delete(scoringConfigs).where(eq(scoringConfigs.id, id));

        return res.json({ success: true });

    } catch (error) {
        console.error("Error deleting scoring config:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
