
import { Router } from 'express';
import { auth } from '../auth/auth';
import { NoteService } from '../services/note-service';

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
 * GET /notes
 * List all notes for the user
 */
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const notes = await NoteService.getNotes(req.session.user.id);
        res.json({ notes });
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

/**
 * GET /notes/stats
 * Get aggregated stats for notes
 */
router.get('/stats', requireAuth, async (req: any, res) => {
    try {
        const stats = await NoteService.getNoteStats(req.session.user.id);
        res.json({ stats });
    } catch (error) {
        console.error("Error fetching note stats:", error);
        res.status(500).json({ error: 'Failed to fetch note stats' });
    }
});

/**
 * POST /notes/sync-extension
 * Receive scraped notes from the Chrome Extension (via web app)
 */
router.post('/sync-extension', requireAuth, async (req: any, res) => {
    try {
        const { notes } = req.body;

        if (!Array.isArray(notes)) {
            return res.status(400).json({ error: 'Invalid data format. Expected "notes" array.' });
        }

        const result = await NoteService.syncNotesFromExtension(req.session.user.id, notes);
        res.json(result);
    } catch (error) {
        console.error("Error syncing notes:", error);
        res.status(500).json({ error: 'Failed to sync notes' });
    }
});

/**
 * GET /notes/hourly-activity
 * Engagement breakdown by hour of day (for chart)
 */
router.get('/hourly-activity', requireAuth, async (req: any, res) => {
    try {
        const data = await NoteService.getHourlyActivity(req.session.user.id);
        res.json({ data });
    } catch (error) {
        console.error("Error fetching hourly activity:", error);
        res.status(500).json({ error: 'Failed to fetch hourly activity' });
    }
});

/**
 * GET /notes/performance-over-time
 * Weekly performance data (for chart)
 */
router.get('/performance-over-time', requireAuth, async (req: any, res) => {
    try {
        const data = await NoteService.getPerformanceOverTime(req.session.user.id);
        res.json({ data });
    } catch (error) {
        console.error("Error fetching performance over time:", error);
        res.status(500).json({ error: 'Failed to fetch performance data' });
    }
});

/**
 * GET /notes/posting-heatmap
 * Day-of-week × hour posting frequency grid
 */
router.get('/posting-heatmap', requireAuth, async (req: any, res) => {
    try {
        const data = await NoteService.getPostingHeatmap(req.session.user.id);
        res.json({ data });
    } catch (error) {
        console.error("Error fetching heatmap:", error);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
});

/**
 * GET /notes/ai-analysis
 * Aggregate all metrics and return an LLM-generated analysis
 */
router.get('/ai-analysis', requireAuth, async (req: any, res) => {
    try {
        const userId = req.session.user.id;

        // Gather all metrics in parallel
        const [notes, hourly, performance, heatmap] = await Promise.all([
            NoteService.getNotes(userId),
            NoteService.getHourlyActivity(userId),
            NoteService.getPerformanceOverTime(userId),
            NoteService.getPostingHeatmap(userId),
        ]);

        // Compute summary stats
        const totalNotes = notes.length;
        const totalLikes = notes.reduce((s, n) => s + (n.likes ?? 0), 0);
        const totalComments = notes.reduce((s, n) => s + (n.comments ?? 0), 0);
        const totalRestacks = notes.reduce((s, n) => s + (n.restacks ?? 0), 0);
        const avgEngagement = totalNotes ? ((totalLikes + totalComments + totalRestacks) / totalNotes).toFixed(1) : 0;

        // Best posting hours (top 3 by engagement)
        const bestHours = [...hourly]
            .sort((a, b) => b.engagement - a.engagement)
            .slice(0, 3)
            .map(h => `${h.label} (${h.engagement} total engagement)`);

        // Best day of week by count
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayTotals: Record<number, number> = {};
        for (const cell of heatmap) {
            dayTotals[cell.dayOfWeek] = (dayTotals[cell.dayOfWeek] ?? 0) + cell.count;
        }
        const bestDay = Object.entries(dayTotals).sort(([, a], [, b]) => b - a)[0];

        // Top 5 notes by likes
        const topNotes = [...notes]
            .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
            .slice(0, 5)
            .map(n => ({
                preview: n.contentPreview?.slice(0, 80),
                likes: n.likes,
                comments: n.comments,
                restacks: n.restacks,
            }));

        // Weekly trend (last 8 weeks)
        const recentWeeks = performance.slice(-8);

        const prompt = `You are an expert Substack growth analyst. Analyze the following metrics for a Substack creator and provide:
1. A brief overall assessment (2-3 sentences)
2. 3 specific hidden insights (things they might not have noticed)
3. 3 concrete, actionable suggestions to grow engagement and subscribers

Be specific, use the actual numbers, and be direct. No fluff.

## Metrics Summary
- Total notes published: ${totalNotes}
- Total likes: ${totalLikes.toLocaleString()}
- Total comments: ${totalComments.toLocaleString()}
- Total restacks: ${totalRestacks.toLocaleString()}
- Avg engagement per note: ${avgEngagement}

## Best Posting Times (by total engagement)
${bestHours.join(', ')}

## Most Active Day
${bestDay ? `${dayNames[Number(bestDay[0])]} (${bestDay[1]} notes)` : 'Not enough data'}

## Weekly Performance Trend (last 8 weeks)
${recentWeeks.map(w => `Week of ${w.week}: ${w.likes} likes, ${w.comments} comments, ${w.restacks} restacks, ${w.noteCount} notes`).join('\n')}

## Top 5 Notes by Likes
${topNotes.map((n, i) => `${i + 1}. "${n.preview}..." — ${n.likes} likes, ${n.comments} comments, ${n.restacks} restacks`).join('\n')}

Respond in this exact JSON format:
{
  "assessment": "...",
  "insights": ["...", "...", "..."],
  "suggestions": ["...", "...", "..."]
}`;

        const aiRes = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'grok-3-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 800,
            }),
        });

        if (!aiRes.ok) {
            const err = await aiRes.text();
            throw new Error(`AI API error: ${err}`);
        }

        const aiJson = await aiRes.json();
        const content = aiJson.choices?.[0]?.message?.content ?? '';

        // Parse JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not parse AI response');
        const analysis = JSON.parse(jsonMatch[0]);

        res.json({ analysis });
    } catch (error: any) {
        console.error('AI analysis error:', error);
        res.status(500).json({ error: error.message ?? 'Failed to generate analysis' });
    }
});

/**
 * DELETE /notes
 */
router.delete('/', requireAuth, async (req: any, res) => {
    try {
        const count = await NoteService.clearNotes(req.session.user.id);
        res.json({ success: true, deleted: count });
    } catch (error) {
        console.error("Error clearing notes:", error);
        res.status(500).json({ error: 'Failed to clear notes' });
    }
});

export default router;
