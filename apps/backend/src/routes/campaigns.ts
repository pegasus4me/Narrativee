import { Router } from 'express';
import { auth } from '../auth/auth';
import { CampaignService } from '../services/campaign-service';

const router = Router();

const requireAuth = async (req: any, res: any, next: any) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) return res.status(401).json({ error: 'Unauthorized' });
        req.session = session;
        next();
    } catch (error) {
        console.error("Auth error", error);
        return res.status(500).json({ error: 'Auth error' });
    }
};

/**
 * GET /campaigns
 * List all campaigns for the user
 */
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const data = await CampaignService.getCampaigns(req.session.user.id);
        res.json({ campaigns: data });
    } catch (error) {
        console.error("Error fetching campaigns", error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

/**
 * GET /campaigns/:id
 * Get a single campaign with all its targets
 */
router.get('/:id', requireAuth, async (req: any, res) => {
    try {
        const campaign = await CampaignService.getCampaignById(req.session.user.id, req.params.id);
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        res.json({ campaign });
    } catch (error) {
        console.error("Error fetching campaign", error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
});

/**
 * POST /campaigns
 * Create a new campaign
 */
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const { name, replyTemplate, sequenceSteps, dailyQuota } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }
        const campaign = await CampaignService.createCampaign(req.session.user.id, {
            name,
            replyTemplate,
            sequenceSteps,
            dailyQuota,
        });
        res.status(201).json({ campaign });
    } catch (error) {
        console.error("Error creating campaign", error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

/**
 * PATCH /campaigns/:id
 * Update a campaign (name, replyTemplate, dailyQuota, status)
 */
router.patch('/:id', requireAuth, async (req: any, res) => {
    try {
        const { name, replyTemplate, sequenceSteps, dailyQuota, status } = req.body;
        const updated = await CampaignService.updateCampaign(req.session.user.id, req.params.id, {
            name,
            replyTemplate,
            sequenceSteps,
            dailyQuota,
            status,
        });
        if (!updated) return res.status(404).json({ error: 'Campaign not found' });
        res.json({ campaign: updated });
    } catch (error) {
        console.error("Error updating campaign", error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

/**
 * DELETE /campaigns/:id
 * Delete a campaign (cascades to targets)
 */
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        await CampaignService.deleteCampaign(req.session.user.id, req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting campaign", error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});

/**
 * DELETE /campaigns/:id/targets
 * Clear all targets for a campaign (reset to start fresh).
 */
router.delete('/:id/targets', requireAuth, async (req: any, res) => {
    try {
        const count = await CampaignService.clearTargets(req.session.user.id, req.params.id);
        res.json({ success: true, deleted: count });
    } catch (error) {
        console.error("Error clearing targets", error);
        res.status(500).json({ error: 'Failed to clear targets' });
    }
});

/**
 * POST /campaigns/:id/targets
 * Add scraped 2nd-degree commenters as targets for a campaign.
 * Called by the extension after scraping comment threads.
 */
router.post('/:id/targets', requireAuth, async (req: any, res) => {
    try {
        const { targets } = req.body;
        if (!Array.isArray(targets) || targets.length === 0) {
            return res.status(400).json({ error: 'targets array is required' });
        }
        const added = await CampaignService.addTargets(req.session.user.id, req.params.id, targets);
        res.status(201).json({ added: added.length, targets: added });
    } catch (error) {
        console.error("Error adding targets", error);
        res.status(500).json({ error: 'Failed to add targets' });
    }
});

/**
 * POST /campaigns/:id/targets/:targetId/replied
 * Mark a target as replied — called by extension after successfully posting the reply.
 */
router.post('/:id/targets/:targetId/replied', requireAuth, async (req: any, res) => {
    try {
        const { replyCommentId, replyText } = req.body;
        if (!replyCommentId) return res.status(400).json({ error: 'replyCommentId is required' });

        await CampaignService.markTargetReplied(req.params.targetId, replyCommentId, replyText);
        await CampaignService.incrementDailyReplies(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking target replied", error);
        res.status(500).json({ error: 'Failed to mark target replied' });
    }
});

/**
 * POST /campaigns/:id/targets/:targetId/skip
 * Skip a target (user decided not to reply to this person)
 */
router.post('/:id/targets/:targetId/skip', requireAuth, async (req: any, res) => {
    try {
        await CampaignService.markTargetSkipped(req.params.targetId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error skipping target", error);
        res.status(500).json({ error: 'Failed to skip target' });
    }
});

/**
 * POST /campaigns/:id/targets/:targetId/reset
 * Reset a skipped/failed target back to pending
 */
router.post('/:id/targets/:targetId/reset', requireAuth, async (req: any, res) => {
    try {
        await CampaignService.markTargetPending(req.params.targetId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error resetting target", error);
        res.status(500).json({ error: 'Failed to reset target' });
    }
});

/**
 * POST /campaigns/:id/targets/:targetId/replied-back
 * Mark that the target replied back to our reply
 */
router.post('/:id/targets/:targetId/replied-back', requireAuth, async (req: any, res) => {
    try {
        await CampaignService.markTargetRepliedBack(req.params.targetId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking target replied-back", error);
        res.status(500).json({ error: 'Failed to mark target replied-back' });
    }
});

/**
 * POST /campaigns/:id/targets/:targetId/subscribed
 * Mark that the target subscribed after our reply
 */
router.post('/:id/targets/:targetId/subscribed', requireAuth, async (req: any, res) => {
    try {
        await CampaignService.markTargetSubscribed(req.params.targetId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking target subscribed", error);
        res.status(500).json({ error: 'Failed to mark target subscribed' });
    }
});

/**
 * GET /campaigns/:id/next-target
 * Get the next pending target for the extension to process.
 * Extension polls this when an active campaign is running.
 */
router.get('/:id/next-target', requireAuth, async (req: any, res) => {
    try {
        const quotaReached = await CampaignService.isQuotaReached(req.params.id);
        if (quotaReached) {
            return res.json({ target: null, reason: 'daily_quota_reached' });
        }

        const campaign = await CampaignService.getCampaignById(req.session.user.id, req.params.id);
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        const steps: string[] = Array.isArray(campaign.sequenceSteps) && campaign.sequenceSteps.length > 0
            ? campaign.sequenceSteps as string[]
            : [campaign.replyTemplate];

        // First priority: new pending targets (step 0)
        let target = await CampaignService.getNextPendingTarget(req.params.id);

        // Second priority: follow-up on targets that replied back and still have steps
        if (!target && steps.length > 1) {
            target = await CampaignService.getNextSequenceFollowUp(req.params.id, steps.length);
        }

        if (!target) return res.json({ target: null });

        const stepIndex = target.sequenceStep ?? 0;
        const promptHint = CampaignService.getStepHint(steps, stepIndex);

        res.json({ target, stepIndex, promptHint, totalSteps: steps.length });
    } catch (error) {
        console.error("Error fetching next target", error);
        res.status(500).json({ error: 'Failed to fetch next target' });
    }
});

/**
 * POST /campaigns/generate-reply
 * Generate a campaign reply using the Grok API (server-side, no user API key needed).
 * Context is passed from the extension (profile + comment data).
 */
router.post('/generate-reply', requireAuth, async (req: any, res) => {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Grok API key not configured' });

    const { context } = req.body;
    if (!context) return res.status(400).json({ error: 'context is required' });

    const { parentCommentContent, targetCommentContent, targetAuthorName, promptHint, originalNoteContent, bio, goals, topics, style, articles } = context;

    const styleDescriptions: Record<string, string> = {
        casual: 'casual and conversational, like texting a friend',
        provocative: 'bold and direct, not afraid to make strong points',
        educational: 'helpful and insightful, sharing useful perspectives',
        witty: 'clever and sharp, with a bit of humor',
        inspirational: 'warm and motivating',
    };
    const writerStyle = styleDescriptions[style] || styleDescriptions.casual;

    const profileContext = [
        bio ? `ABOUT YOU: ${bio}` : '',
        goals ? `YOUR GOALS: ${goals}` : '',
        topics ? `YOUR TOPICS: ${topics}` : '',
        articles ? `SAMPLE OF THEIR WRITING (match this voice):\n${(articles as string).substring(0, 1500)}` : '',
    ].filter(Boolean).join('\n');

    // When the user has defined a campaign goal (promptHint), the reply must be
    // goal-driven outreach — not a generic engagement comment. Use a different
    // system prompt that leads with the goal and drops rules that conflict with it.
    const isGoalDriven = Boolean(promptHint?.trim());

    const systemPrompt = isGoalDriven
        ? `You are writing a short outreach reply on Substack on behalf of someone.

${profileContext}

CAMPAIGN GOAL: ${promptHint}

Your job: write a 1-2 sentence reply to the target's comment that naturally leads toward the campaign goal above. The reply must feel personal and relevant to what they said — not generic. Tie what they said to the goal.

HARD RULES:
1. Do NOT start with a name or greeting.
2. Do NOT use any dash character (—, –, or hyphen as punctuation). Use a comma or period instead.
3. Do NOT be salesy, spammy, or pushy. Sound like a real person.
4. Max 20 words per sentence.
5. End with a single direct question that connects their comment to the goal.

BANNED WORDS: resonate, profound, delve, unpack, navigate, journey, game-changer, absolutely, exciting, amazing, awesome, great, love this, stumbled, discover, connections

Return ONLY the reply text. Nothing else.`
        : `Write a single short reply to a Substack comment. 1 sentence, 2 max.

${profileContext}

STYLE: ${writerStyle}

HARD RULES — violating any of these makes the reply unusable:
1. Do NOT start with a name or greeting of any kind.
2. Do NOT use any dash character: not —, not –, not a hyphen used as punctuation. Replace with a comma or period.
3. Do NOT reference yourself exploring, browsing, or discovering people.
4. Do NOT praise or compliment the person or their idea.
5. Stay strictly on what they said. One specific reaction or one specific question.
6. Max 20 words per sentence.

BANNED WORDS: resonate, profound, delve, unpack, navigate, journey, game-changer, absolutely, exciting, amazing, awesome, great, love this, smart, fresh, voices, stumbled, discover, dipping, toes, connections

Return ONLY the reply text. Nothing else.`;

    const userPrompt = `${originalNoteContent ? `ORIGINAL NOTE (the post being discussed):\n"${originalNoteContent}"\n\n` : ''}PARENT COMMENT (what the target replied to):
"${parentCommentContent || '(not available)'}"

TARGET'S REPLY (what you are responding to):
"${targetCommentContent || '(not available)'}"

${targetAuthorName ? `Target's name: ${targetAuthorName}` : ''}

Write a reply to the target's comment:`;

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'grok-3-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: 200,
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            const err = await response.json() as { error?: { message?: string } };
            return res.status(500).json({ error: err.error?.message || 'Grok API error' });
        }

        const data = await response.json() as { choices: { message: { content: string } }[] };
        let reply = data.choices[0]?.message?.content?.trim();
        if (!reply) return res.status(500).json({ error: 'No reply generated' });

        // Strip any dash characters the model snuck in
        reply = reply.replace(/\s*[—–]\s*/g, ', ').replace(/ - /g, ', ');

        res.json({ reply });
    } catch (error) {
        console.error('Error generating campaign reply:', error);
        res.status(500).json({ error: 'Failed to generate reply' });
    }
});

export default router;
