
import { Router } from 'express';
import { auth } from '../auth/auth';
import { SubscriberService } from '../services/subscriber-service';

const router = Router();

const requireAuth = async (req: any, res: any, next: any) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) return res.status(401).json({ error: 'Unauthorized' });
        req.session = session;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Auth error' });
    }
};

/**
 * GET /subscribers
 */
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const data = await SubscriberService.getSubscribers(req.session.user.id);
        res.json({ data });
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});

/**
 * POST /subscribers/sync-extension
 */
router.post('/sync-extension', requireAuth, async (req: any, res) => {
    try {
        const { data } = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Expected "data" array' });
        }
        const result = await SubscriberService.syncSubscribers(req.session.user.id, data);
        res.json(result);
    } catch (error) {
        console.error("Error syncing subscribers:", error);
        res.status(500).json({ error: 'Failed to sync subscribers' });
    }
});

export default router;
