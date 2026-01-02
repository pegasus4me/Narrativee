import { Router, Response } from 'express';
import { verifyAuth, AuthRequest } from '../middleware/auth';
// import { getUserTokenBalance } from '../services/database/tokenDB';

// Mock function until tokenDB is implemented
async function getUserTokenBalance(userId: string) {
    return 100; // Default credits
}

const router = Router();

// Get user's credit/token balance
router.get('/credits', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const credits = await getUserTokenBalance(req.user.id);

        return res.json({
            success: true,
            credits
        });
    } catch (error: any) {
        console.error('Error fetching user credits:', error);
        return res.status(500).json({
            error: 'Failed to fetch credits',
            message: error.message
        });
    }
});

export default router;
