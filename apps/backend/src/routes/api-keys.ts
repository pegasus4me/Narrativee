import { Router } from 'express';
import { db } from '../auth/auth';
import { apiKeys } from '../auth/schema/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Middleware to mock auth for now (since we haven't integrated full auth header passing yet)
// In prod, use: import { verifyAuth } from '../middleware/auth';
const mockAuth = (req: any, res: any, next: any) => {
    // FIXME: wiring up real auth later. For now, assuming header or hardcoded for dev
    // We need a way to know WHICH user is asking.
    // For V0.1 Dashboard, we can just hardcode the admin ID we created earlier
    // or pass it in headers.

    // Let's assume the frontend sends 'x-user-id' for this pair programming session
    // to keep it simple, or we can fetch the first user.
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing x-user-id header' });
    }
    req.user = { id: userId };
    next();
};

// GET /: Fetch the active API key
router.get('/', mockAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;

        // Find active key
        const keyRecord = await db.query.apiKeys.findFirst({
            where: and(
                eq(apiKeys.userId, userId),
                eq(apiKeys.isActive, true)
            )
        });

        if (!keyRecord) {
            return res.json({ key: null });
        }

        // Calculate SDK status based on lastEventAt
        let sdkStatus: 'connected' | 'waiting' | 'offline' = 'waiting';
        if (keyRecord.lastEventAt) {
            const hoursSinceLastEvent = (Date.now() - new Date(keyRecord.lastEventAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastEvent < 24) {
                sdkStatus = 'connected';
            } else if (hoursSinceLastEvent > 168) { // 7 days
                sdkStatus = 'offline';
            } else {
                sdkStatus = 'connected'; // Still counts as connected if within 7 days
            }
        }

        return res.json({
            key: keyRecord.key,
            createdAt: keyRecord.createdAt,
            lastEventAt: keyRecord.lastEventAt,
            sdkStatus
        });
    } catch (error) {
        console.error('Error fetching API key:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /regenerate: Create a new key and invalidate old ones
router.post('/regenerate', mockAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;

        // 1. Deactivate old keys
        await db.update(apiKeys)
            .set({ isActive: false })
            .where(eq(apiKeys.userId, userId));

        // 2. Create new key
        const newKey = `nr-live-${uuidv4()}`;
        const [keyRecord] = await db.insert(apiKeys).values({
            key: newKey,
            userId: userId,
            mode: 'live',
            isActive: true,
        }).returning();

        return res.json({
            key: keyRecord.key,
            createdAt: keyRecord.createdAt
        });

    } catch (error) {
        console.error('Error regenerating API key:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
