import { Router } from 'express';
import { auth } from '../auth/auth';
import { db } from '../auth/auth';
import { inspirations } from '../auth/schema/schema';
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

/**
 * GET /inspirations
 * List all saved inspirations for the user
 */
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const rows = await db
            .select()
            .from(inspirations)
            .where(eq(inspirations.userId, req.session.user.id))
            .orderBy(inspirations.savedAt);

        // Map to the format the web app expects
        const notes = rows.map(r => ({
            id: r.id,
            content: r.content,
            author: {
                name: r.authorName || 'Unknown',
                handle: r.authorHandle || '',
                avatar: r.authorAvatar || '',
            },
            engagement: {
                likes: r.likes ?? 0,
                restacks: r.restacks ?? 0,
                comments: r.comments ?? 0,
            },
            url: r.url || '',
            savedAt: r.savedAt,
            tags: (r.tags as string[]) || [],
            notes: r.personalNotes || '',
        }));

        res.json({ notes });
    } catch (error) {
        console.error('Error fetching inspirations:', error);
        res.status(500).json({ error: 'Failed to fetch inspirations' });
    }
});

/**
 * POST /inspirations
 * Save one or more inspirations (upsert by id)
 */
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const { notes } = req.body;
        console.log(`💡 [Backend] Received ${notes?.length} inspirations to save for user ${req.session.user.id}`);

        if (!Array.isArray(notes)) {
            return res.status(400).json({ error: 'Expected "notes" array' });
        }

        const userId = req.session.user.id;

        for (const note of notes) {
            console.log(`💡 [Backend] Processing note: ${note.id}`);
            await db
                .insert(inspirations)
                .values({
                    id: note.id,
                    userId,
                    content: note.content,
                    authorName: note.author?.name,
                    authorHandle: note.author?.handle,
                    authorAvatar: note.author?.avatar,
                    url: note.url,
                    likes: note.engagement?.likes ?? 0,
                    restacks: note.engagement?.restacks ?? 0,
                    comments: note.engagement?.comments ?? 0,
                    tags: note.tags ?? [],
                    personalNotes: note.notes ?? '',
                    savedAt: note.savedAt ? new Date(note.savedAt) : new Date(),
                })
                .onConflictDoUpdate({
                    target: inspirations.id,
                    set: {
                        tags: note.tags ?? [],
                        personalNotes: note.notes ?? '',
                        likes: note.engagement?.likes ?? 0,
                        restacks: note.engagement?.restacks ?? 0,
                        comments: note.engagement?.comments ?? 0,
                    },
                });
        }

        res.json({ success: true, saved: notes.length });
    } catch (error) {
        console.error('Error saving inspirations:', error);
        res.status(500).json({ error: 'Failed to save inspirations' });
    }
});

/**
 * DELETE /inspirations/:id
 * Delete a single inspiration
 */
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        await db
            .delete(inspirations)
            .where(
                and(
                    eq(inspirations.id, req.params.id),
                    eq(inspirations.userId, req.session.user.id)
                )
            );
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting inspiration:', error);
        res.status(500).json({ error: 'Failed to delete inspiration' });
    }
});

/**
 * PATCH /inspirations/:id
 * Update tags or personal notes on an inspiration
 */
router.patch('/:id', requireAuth, async (req: any, res) => {
    try {
        const { tags, notes: personalNotes } = req.body;
        const updateData: any = {};
        if (tags !== undefined) updateData.tags = tags;
        if (personalNotes !== undefined) updateData.personalNotes = personalNotes;

        await db
            .update(inspirations)
            .set(updateData)
            .where(
                and(
                    eq(inspirations.id, req.params.id),
                    eq(inspirations.userId, req.session.user.id)
                )
            );

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating inspiration:', error);
        res.status(500).json({ error: 'Failed to update inspiration' });
    }
});

export default router;
