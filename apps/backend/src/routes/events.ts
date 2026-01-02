import { sql } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../auth/auth';
import { apiKeys, saasUsers, events, scoringConfigs, workflows } from '../auth/schema/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apikeyValidator } from '../middleware/apikeyValidator';
const router = Router();

router.post('/track', apikeyValidator, async (req, res) => {
    // 1. Get data
    const { userId, eventName, metadata, userTraits } = req.body;
    console.log("userTraits", userTraits, metadata)
    try {


        // 2. Calculate Score Increment
        const apiKeyId = (req as any).user.apiKeyId;

        let scoreIncrement = 0;
        const config = await db.query.scoringConfigs.findFirst({
            where: and(
                eq(scoringConfigs.apiKeyId, apiKeyId),
                eq(scoringConfigs.eventName, eventName)
            )
        });

        if (config) {
            scoreIncrement = config.scoreValue;
        }

        // 3. Upsert SaaS User
        const [existingUser] = await db.select()
            .from(saasUsers)
            .where(sql`${saasUsers.id} = ${userId} AND ${saasUsers.apiKeyId} = ${apiKeyId}`);

        // Prepare new metadata (merging existing matched traits if provided)
        // If userTraits is passed directly (from SDK root), use it.
        // Also check inside metadata for traits if sent via identify event.
        const incomingTraits = userTraits || {};
        if (eventName === 'narrativee_identify') {
            Object.assign(incomingTraits, metadata);
        }

        // Handle popup click tracking for attribution
        let popupClickData: { workflowId: string; componentId: string } | null = null;
        if (eventName === 'narrativee_popup_clicked' && metadata?.workflowId) {
            popupClickData = {
                workflowId: metadata.workflowId,
                componentId: metadata.componentId || 'unknown'
            };
        }

        if (existingUser) {
            // Update lastSeenAt AND increment score AND merge metadata
            const currentMeta = existingUser.metadata as any || {};
            const newMeta = { ...currentMeta, ...incomingTraits };

            // Add popup click to clickedPopups array if applicable
            if (popupClickData) {
                if (!newMeta.clickedPopups) newMeta.clickedPopups = [];
                // Avoid duplicates - store unique by workflowId
                if (!newMeta.clickedPopups.some((p: any) => p.workflowId === popupClickData!.workflowId)) {
                    newMeta.clickedPopups.push({
                        ...popupClickData,
                        clickedAt: new Date().toISOString()
                    });
                }
            }

            await db.update(saasUsers)
                .set({
                    lastSeenAt: new Date(),
                    score: sql`${saasUsers.score} + ${scoreIncrement}`,
                    metadata: newMeta
                })
                .where(eq(saasUsers.id, userId));
        } else {
            // Create new user with initial score
            await db.insert(saasUsers).values({
                id: userId,
                apiKeyId: apiKeyId,
                score: scoreIncrement, // Initial score
                metadata: incomingTraits, // Use incoming traits
                lastSeenAt: new Date(),
            });
        }

        // 4. Log Event to DB
        await db.insert(events).values({
            eventName: eventName,
            saasUserId: userId,
            apiKeyId: apiKeyId,
            metadata: metadata,
        });

        // 4b. Update API Key lastEventAt to track SDK connection status
        await db.update(apiKeys)
            .set({ lastEventAt: new Date() })
            .where(eq(apiKeys.id, apiKeyId));

        // 5. Check Workflows
        const [updatedUser] = await db.select().from(saasUsers).where(and(eq(saasUsers.id, userId), eq(saasUsers.apiKeyId, apiKeyId)));

        // Fetch active workflows
        const activeWorkflows = await db.select().from(workflows).where(and(
            eq(workflows.apiKeyId, apiKeyId),
            eq(workflows.isActive, true)
        ));

        console.log(`[Debug] Checking ${activeWorkflows.length} active workflows for User ${userId} (Score: ${updatedUser.score})`);

        const actions = [];
        const triggeredWorkflowIds: string[] = (updatedUser.metadata as any)?.triggeredWorkflows || [];
        let metadataUpdated = false;

        for (const wf of activeWorkflows) {
            // Check if already triggered
            if (triggeredWorkflowIds.includes(wf.id)) {
                console.log(`[Debug] Skipping Workflow ${wf.id} (Name: ${wf.name}) - Already Triggered`);
                continue;
            }

            if (wf.triggerType === 'score') {
                const condition = wf.triggerCondition as any; // { operator: '>', value: 50 }
                if (!condition) continue;

                let match = false;
                const value = Number(condition.value);
                const userScore = updatedUser.score || 0;

                console.log(`[Debug] Evaluating Workflow ${wf.id}: Score ${userScore} ${condition.operator} ${value}?`);

                if (condition.operator === '>' && userScore > value) match = true;
                else if (condition.operator === '>=' && userScore >= value) match = true;
                else if (condition.operator === '<' && userScore < value) match = true;
                else if (condition.operator === '<=' && userScore <= value) match = true;
                else if (condition.operator === '==' && userScore === value) match = true;

                if (match) {
                    console.log(`[Debug] MATCHED! Triggering action.`);
                    actions.push({
                        type: wf.actionType,
                        config: wf.actionConfig
                    });
                    triggeredWorkflowIds.push(wf.id);
                    metadataUpdated = true;
                } else {
                    console.log(`[Debug] No Match.`);
                }
            } else if (wf.triggerType === 'event') {
                const condition = wf.triggerCondition as any; // { eventName: 'view_pricing' }
                if (!condition) continue;

                console.log(`[Debug] Evaluating Workflow ${wf.id}: Event ${eventName} === ${condition.eventName}?`);

                if (condition.eventName === eventName) {
                    console.log(`[Debug] MATCHED! Triggering action for event.`);
                    actions.push({
                        type: wf.actionType,
                        config: wf.actionConfig
                    });
                    // IMPORTANT: For event triggers, maybe we DON'T want one-off filtering? 
                    // Or usually popups should show once per session/user to avoid spam?
                    // Let's keep one-off for now to stay safe.
                    triggeredWorkflowIds.push(wf.id);
                    metadataUpdated = true;
                }
            }

            // Update metadata-triggered workflows if changed
            if (metadataUpdated) {
                await db.update(saasUsers).set({
                    metadata: { ...(updatedUser.metadata as object), triggeredWorkflows: triggeredWorkflowIds }
                }).where(and(eq(saasUsers.id, userId), eq(saasUsers.apiKeyId, apiKeyId)));
            }
        }

        console.log(`Event persisted: ${eventName}. Actions: ${actions.length}`);

        // 6. Return success
        console.log('[DEBUG] Sending response with actions:', JSON.stringify({ success: true, actions }, null, 2));
        return res.json({ success: true, actions });
    } catch (error) {
        console.error('Error tracking event:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// [NEW] Get Events for a User
router.get('/user/:userId', apikeyValidator, async (req, res) => {
    const { userId } = req.params;
    const apiKeyId = (req as any).user.apiKeyId;

    try {
        // Fetch events
        const userEvents = await db.select()
            .from(events)
            .where(sql`${events.saasUserId} = ${userId} AND ${events.apiKeyId} = ${apiKeyId}`)
            .orderBy(desc(events.createdAt))
            .limit(50);

        // Fetch scoring configs for this API key
        const configs = await db.select()
            .from(scoringConfigs)
            .where(eq(scoringConfigs.apiKeyId, apiKeyId));

        // Create a lookup map: eventName -> scoreValue
        const scoreMap = new Map<string, number>();
        configs.forEach(c => scoreMap.set(c.eventName, c.scoreValue));

        // Enrich events with score
        const enrichedEvents = userEvents.map(e => ({
            ...e,
            scoreValue: scoreMap.get(e.eventName) || 0
        }));

        return res.json({ events: enrichedEvents });
    } catch (error) {
        console.error('Error fetching user events:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// [NEW] Reset User Triggers (For Testing)
router.post('/user/:userId/reset', apikeyValidator, async (req, res) => {
    const { userId } = req.params;
    const apiKeyId = (req as any).user.apiKeyId;

    try {
        const [existingUser] = await db.select().from(saasUsers)
            .where(and(eq(saasUsers.id, userId), eq(saasUsers.apiKeyId, apiKeyId)));

        if (!existingUser) return res.status(404).json({ error: 'User not found' });

        // Clear triggeredWorkflows but keep other metadata
        const metadata = existingUser.metadata as any || {};
        metadata.triggeredWorkflows = [];

        // OPTIONAL: Reset score to 0
        // const newScore = 0; 

        await db.update(saasUsers)
            .set({ metadata, score: 0 }) // Let's also reset score for clean test
            .where(and(eq(saasUsers.id, userId), eq(saasUsers.apiKeyId, apiKeyId)));

        return res.json({ success: true, message: 'User history reset' });
    } catch (error) {
        console.error('Error resetting user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
