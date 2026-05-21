import { Router, Response } from 'express';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { db } from '../auth/auth';
import { user } from '../auth/schema/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get user's credit/token balance
router.get('/credits', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userData = await db.select({ tokens: user.tokens, plan: user.plan }).from(user).where(eq(user.id, req.user.id)).limit(1);

        const credits = userData.length > 0 ? (userData[0].tokens ?? 0) : 0;
        const plan = (userData.length > 0 && userData[0].plan) ? userData[0].plan : 'free';

        return res.json({
            success: true,
            credits,
            plan
        });
    } catch (error: any) {
        console.error('[User] Error fetching credits:', error);
        return res.status(500).json({
            error: 'Failed to fetch credits',
            message: error.message
        });
    }
});

// NOTE: Generic /credits/deduct endpoint was removed for security.
// Credits are now only deducted server-side as part of specific business actions
// (e.g., angle extraction, draft generation) to prevent unauthorized manipulation.

export default router;
