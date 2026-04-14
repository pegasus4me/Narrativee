import { Router } from 'express';
import { auth, db } from '../auth/auth';
import { watchlists, watchlistMembers } from '../auth/schema/schema';
import { eq, and } from 'drizzle-orm';

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

/** GET /watchlists — list all watchlists with their members */
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const userId = req.session.user.id;
        const rows = await db.query.watchlists.findMany({
            where: eq(watchlists.userId, userId),
            with: { members: true },
            orderBy: (w, { asc }) => [asc(w.createdAt)],
        });
        return res.json({ watchlists: rows });
    } catch (error) {
        console.error('[Watchlists] GET error:', error);
        return res.status(500).json({ error: 'Failed to fetch watchlists' });
    }
});

/** POST /watchlists — create a new watchlist */
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

        const [created] = await db.insert(watchlists)
            .values({ userId: req.session.user.id, name: name.trim() })
            .returning();

        return res.status(201).json({ watchlist: { ...created, members: [] } });
    } catch (error) {
        console.error('[Watchlists] POST error:', error);
        return res.status(500).json({ error: 'Failed to create watchlist' });
    }
});

/** PATCH /watchlists/:id — rename a watchlist */
router.patch('/:id', requireAuth, async (req: any, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

        const [updated] = await db.update(watchlists)
            .set({ name: name.trim(), updatedAt: new Date() })
            .where(and(eq(watchlists.id, req.params.id), eq(watchlists.userId, req.session.user.id)))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Watchlist not found' });
        return res.json({ watchlist: updated });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update watchlist' });
    }
});

/** DELETE /watchlists/:id — delete a watchlist (cascades members) */
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        await db.delete(watchlists)
            .where(and(eq(watchlists.id, req.params.id), eq(watchlists.userId, req.session.user.id)));
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete watchlist' });
    }
});

/** POST /watchlists/:id/members — add a handle to a watchlist */
router.post('/:id/members', requireAuth, async (req: any, res) => {
    try {
        const { handle, name } = req.body;
        if (!handle?.trim()) return res.status(400).json({ error: 'handle is required' });

        // Verify ownership
        const list = await db.query.watchlists.findFirst({
            where: and(eq(watchlists.id, req.params.id), eq(watchlists.userId, req.session.user.id)),
        });
        if (!list) return res.status(404).json({ error: 'Watchlist not found' });

        const cleanHandle = handle.trim().replace(/^@/, '');

        const [member] = await db.insert(watchlistMembers)
            .values({ watchlistId: req.params.id, handle: cleanHandle, name: name?.trim() || null })
            .onConflictDoNothing()
            .returning();

        return res.status(201).json({ member });
    } catch (error) {
        console.error('[Watchlists] add member error:', error);
        return res.status(500).json({ error: 'Failed to add member' });
    }
});

/** DELETE /watchlists/:id/members/:memberId — remove a handle */
router.delete('/:id/members/:memberId', requireAuth, async (req: any, res) => {
    try {
        await db.delete(watchlistMembers)
            .where(eq(watchlistMembers.id, req.params.memberId));
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to remove member' });
    }
});

export default router;
