import { Router, Response } from 'express';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { db } from '../auth/auth';
import { user, contentSources, articles, channels, knowledgeBase } from '../auth/schema/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get user's credit/token balance
router.get('/credits', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userData = await db.select({ tokens: user.tokens, carouselTokens: user.carouselTokens, plan: user.plan }).from(user).where(eq(user.id, req.user.id)).limit(1);

        const credits = userData.length > 0 ? (userData[0].tokens ?? 0) : 0;
        const carouselCredits = userData.length > 0 ? (userData[0].carouselTokens ?? 0) : 0;
        const plan = (userData.length > 0 && userData[0].plan) ? userData[0].plan : 'free';

        return res.json({
            success: true,
            credits,
            carouselCredits,
            plan
        });
    } catch (error: any) {
        console.error('[User] Error fetching credits:', error);
        return res.status(500).json({
            error: 'Failed to fetch credits',
            message: error.message
        });
    }
});

// Complete onboarding
router.post('/onboard', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if user is already onboarded
        const [currentUser] = await db.select({ onboarded: user.onboarded, tokens: user.tokens }).from(user).where(eq(user.id, req.user.id)).limit(1);
        
        let rewardAdded = false;
        if (currentUser && !currentUser.onboarded) {
            await db.update(user)
                .set({ 
                    onboarded: true,
                    tokens: (currentUser.tokens ?? 0) + 10
                })
                .where(eq(user.id, req.user.id));
            rewardAdded = true;
        } else {
            await db.update(user)
                .set({ onboarded: true })
                .where(eq(user.id, req.user.id));
        }

        return res.json({
            success: true,
            message: 'Onboarding completed successfully',
            rewardAdded
        });
    } catch (error: any) {
        console.error('[User] Error completing onboarding:', error);
        return res.status(500).json({
            error: 'Failed to complete onboarding',
            message: error.message
        });
    }
});

// Complete onboarding with Demo Sandbox Seed Data
router.post('/onboard-demo', verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = req.user.id;

        // Check if they already have a demo source
        const existingSources = await db.select().from(contentSources).where(
            and(eq(contentSources.userId, userId), eq(contentSources.url, 'https://demo.substack.com/feed'))
        ).limit(1);

        let demoSourceId: string;

        if (existingSources.length > 0) {
            demoSourceId = existingSources[0].id;
        } else {
            // 1. Seed Content Source
            const [newSource] = await db.insert(contentSources).values({
                userId,
                platform: 'substack',
                url: 'https://demo.substack.com/feed',
                avatarUrl: 'https://substack.com/img/substack.png',
                lastSyncedAt: new Date(),
            }).returning({ id: contentSources.id });
            demoSourceId = newSource.id;

            // 2. Seed Articles
            await db.insert(articles).values([
                {
                    userId,
                    sourceId: demoSourceId,
                    title: "The 10x Content Engine: Repurposing Newsletter Issues",
                    content: `When you spend 10 hours writing a deep-dive newsletter issue, you shouldn't just hit send and hope for the best. You need to repurpose it.

Here is the 10x Content Repurposing framework:
1. The Core Idea: Extract the single most contrarian or high-impact lesson.
2. The Platform-Native Formats:
   - X: Write a short, high-impact statement under 280 characters.
   - LinkedIn: Write a highly structured, spaced-out post with a bold hook.
   - Threads: Write a raw, conversational reflection.
3. The Visual Component: Convert the key takeaways into a multi-slide carousel.

By doing this, you translate one deep-dive issue into multiple native channel posts.`,
                    url: "https://demo.substack.com/p/10x-content-engine",
                    publishedAt: new Date(),
                    extractedAngles: [
                        "Contrarian Take: Stop trying to publish everywhere. Master one channel first.",
                        "Uncomfortable Truth: 90% of content creators sound like generic templates.",
                        "The Hidden Mistake: Copy-pasting the exact same content to X and LinkedIn.",
                        "The Framework: The 3-step 'Voice Mirroring' blueprint."
                    ]
                },
                {
                    userId,
                    sourceId: demoSourceId,
                    title: "Why Most Startups Fail at Brand Voice (And How to Fix It)",
                    content: `Most startups write copy that sounds like a soulless corporate PDF. They use words like "synergy," "streamline," and "leverage."

To fix your brand voice:
- Avoid buzzwords. Write how you speak to a friend.
- Use counter-intuitive analogies.
- Keep sentences short. Short sentences create momentum.

A strong brand voice builds trust. Trust builds distribution. Distribution wins.`,
                    url: "https://demo.substack.com/p/brand-voice-guide",
                    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    extractedAngles: [
                        "Avoid buzzwords. Write how you speak to a friend.",
                        "Use counter-intuitive analogies instead of technical jargon.",
                        "Keep sentences short. Short sentences create momentum."
                    ]
                }
            ]);
        }

        // 3. Seed Channels (if X and LinkedIn demo channels are not already created)
        const existingChannels = await db.select().from(channels).where(
            and(eq(channels.userId, userId), eq(channels.providerAccountId, 'demo_x'))
        ).limit(1);

        if (existingChannels.length === 0) {
            await db.insert(channels).values([
                {
                    userId,
                    platform: 'x',
                    providerAccountId: 'demo_x',
                    accountName: '@demo_creator',
                    avatarUrl: 'https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg',
                    accessToken: 'demo',
                    isConnected: true,
                },
                {
                    userId,
                    platform: 'linkedin',
                    providerAccountId: 'demo_linkedin',
                    accountName: 'Demo Creator',
                    avatarUrl: 'https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg',
                    accessToken: 'demo',
                    isConnected: true,
                }
            ]);
        }

        // 4. Seed Knowledge Base Voice Memory Profile
        const [existingKb] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.userId, userId)).limit(1);
        const demoVoiceMemory = {
            status: "ready",
            lastLearnedSourceId: demoSourceId,
            lastLearnedAt: new Date().toISOString(),
            strictness: 50,
            profile: {
                tone: "Conversational, direct, punchy",
                vocabulary: "Simple, creator-focused, action-oriented",
                sentenceLength: "Short, crisp",
                humorLevel: "Low to moderate, professional",
                opinionatedVsNeutral: "Opinionated and authority-building",
                ctaStyle: "Engaging and question-based",
                topicsToAvoid: "Corporate jargon, fluff, buzzwords",
                frequentPhrases: "The truth is, standard playbook, counter-intuitive"
            },
            sources: [
                {
                    category: "newsletter",
                    label: "Demo Newsletter",
                    content: "The 10x Content Engine: Repurposing Newsletter Issues...",
                    url: "https://demo.substack.com/p/10x-content-engine"
                }
            ]
        };

        if (existingKb) {
            await db.update(knowledgeBase).set({
                brandVoiceTraining: "Direct, engaging creator voice. First-person perspective. High-impact short sentences. Avoids corporate buzzwords and marketing speak.",
                voiceMemory: demoVoiceMemory,
                updatedAt: new Date()
            }).where(eq(knowledgeBase.id, existingKb.id));
        } else {
            await db.insert(knowledgeBase).values({
                userId,
                brandVoiceTraining: "Direct, engaging creator voice. First-person perspective. High-impact short sentences. Avoids corporate buzzwords and marketing speak.",
                voiceMemory: demoVoiceMemory,
            });
        }

        // 5. Update user plan, onboarded status, and reward +10 Stars
        const [currentUser] = await db.select({ onboarded: user.onboarded, tokens: user.tokens }).from(user).where(eq(user.id, userId)).limit(1);
        let rewardAdded = false;

        if (currentUser && !currentUser.onboarded) {
            await db.update(user)
                .set({ 
                    onboarded: true,
                    tokens: (currentUser.tokens ?? 30) + 10
                })
                .where(eq(user.id, userId));
            rewardAdded = true;
        } else {
            await db.update(user)
                .set({ onboarded: true })
                .where(eq(user.id, userId));
        }

        return res.json({
            success: true,
            message: 'Demo Sandbox onboarded and seeded successfully',
            rewardAdded
        });
    } catch (error: any) {
        console.error('[User] Error during demo onboarding:', error);
        return res.status(500).json({
            error: 'Failed to complete demo onboarding',
            message: error.message
        });
    }
});

// NOTE: Generic /credits/deduct endpoint was removed for security.
// Credits are now only deducted server-side as part of specific business actions
// (e.g., angle extraction, draft generation) to prevent unauthorized manipulation.

export default router;
