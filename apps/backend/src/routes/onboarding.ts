import { Router } from 'express';
import { db, auth } from '../auth/auth';
import { user } from '../auth/schema/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Middleware to get authenticated user
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

// GET /onboarding - Check onboarding status
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const userId = req.session.user.id;

        const userData = await db.query.user.findFirst({
            where: eq(user.id, userId),
            columns: { onboarded: true }
        });

        return res.json({ onboarded: userData?.onboarded ?? false });
    } catch (error) {
        console.error('Error fetching onboarding status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /onboarding/complete - Mark onboarding as complete
router.post('/complete', requireAuth, async (req: any, res) => {
    try {
        const userId = req.session.user.id;

        await db.update(user)
            .set({ onboarded: true })
            .where(eq(user.id, userId));

        return res.json({ success: true, onboarded: true });
    } catch (error) {
        console.error('Error completing onboarding:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
