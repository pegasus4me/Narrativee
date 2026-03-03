
import { Router } from 'express';
import { auth } from '../auth/auth';
import { PostService } from '../services/post-service';

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

/**
 * GET /posts
 * List all posts for the user
 */
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const posts = await PostService.getPosts(req.session.user.id);
        res.json({ posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

/**
 * GET /posts/stats
 * Get aggregated stats
 */
router.get('/stats', requireAuth, async (req: any, res) => {
    try {
        const stats = await PostService.getStats(req.session.user.id);
        res.json({ stats });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * POST /posts/sync-extension
 * Receive scraped data from Chrome Extension
 */
router.post('/sync-extension', requireAuth, async (req: any, res) => {
    try {
        const { posts } = req.body;

        if (!Array.isArray(posts)) {
            return res.status(400).json({ error: 'Invalid data format. Expected "posts" array.' });
        }

        const result = await PostService.syncPostsFromExtension(req.session.user.id, posts);
        res.json(result);
    } catch (error) {
        console.error("Error syncing posts:", error);
        res.status(500).json({ error: 'Failed to sync posts' });
    }
});

export default router;
