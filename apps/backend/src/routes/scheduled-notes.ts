import { Router } from 'express';
import { auth } from '../auth/auth';
import { ScheduledNoteService } from '../services/scheduled-note-service';

const router = Router();

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
 * GET /scheduled-notes
 * List all scheduled notes for the user
 */
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const notes = await ScheduledNoteService.getAll(req.session.user.id);
        res.json({ notes });
    } catch (error) {
        console.error("Error fetching scheduled notes:", error);
        res.status(500).json({ error: 'Failed to fetch scheduled notes' });
    }
});

/**
 * POST /scheduled-notes
 * Create or update a scheduled note
 */
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const { id, content, scheduledDate, scheduledTime, status } = req.body;
        if (!id || !content || !scheduledDate) {
            return res.status(400).json({ error: 'Missing required fields: id, content, scheduledDate' });
        }
        const result = await ScheduledNoteService.upsert(req.session.user.id, {
            id, content, scheduledDate, scheduledTime, status
        });
        res.json(result);
    } catch (error) {
        console.error("Error saving scheduled note:", error);
        res.status(500).json({ error: 'Failed to save scheduled note' });
    }
});

/**
 * PUT /scheduled-notes/:id/status
 * Update a note's status
 */
router.put('/:id/status', requireAuth, async (req: any, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Missing status' });
        }
        const result = await ScheduledNoteService.updateStatus(req.session.user.id, req.params.id, status);
        res.json(result);
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

/**
 * DELETE /scheduled-notes/:id
 * Delete a scheduled note
 */
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        const result = await ScheduledNoteService.remove(req.session.user.id, req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Error deleting scheduled note:", error);
        res.status(500).json({ error: 'Failed to delete scheduled note' });
    }
});

export default router;
