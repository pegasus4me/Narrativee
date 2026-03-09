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

        console.log(`[Credits API] User ${req.user.id} - Credits: ${credits}, Plan: ${plan}`);

        return res.json({
            success: true,
            credits,
            plan
        });
    } catch (error: any) {
        console.error('Error fetching user credits:', error);
        return res.status(500).json({
            error: 'Failed to fetch credits',
            message: error.message
        });
    }
});

// Deduct user credits
router.post('/credits/deduct', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { amount } = req.body;
        const deductionAmount = typeof amount === 'number' && amount > 0 ? amount : 1;

        // Fetch current tokens
        const userData = await db.select({ tokens: user.tokens }).from(user).where(eq(user.id, req.user.id)).limit(1);

        if (userData.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentTokens = userData[0].tokens ?? 0;

        if (currentTokens < deductionAmount) {
            return res.status(402).json({
                error: 'Insufficient credits',
                message: 'You do not have enough credits to perform this action.'
            });
        }

        // Deduct
        const newTokens = currentTokens - deductionAmount;
        await db.update(user).set({ tokens: newTokens }).where(eq(user.id, req.user.id));

        return res.json({
            success: true,
            credits: newTokens
        });
    } catch (error: any) {
        console.error('Error deducting user credits:', error);
        return res.status(500).json({
            error: 'Failed to deduct credits',
            message: error.message
        });
    }
});

export default router;
