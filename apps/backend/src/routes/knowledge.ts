import { Router, Response } from 'express';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { db } from '../auth/auth';
import { knowledgeBase } from '../auth/schema/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/knowledge-base
router.get('/', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [record] = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.userId, req.user.id))
      .limit(1);

    if (!record) {
      return res.json({
        customHooks: [],
        customTemplates: [],
        bannedWords: [],
        brandVoiceTraining: ""
      });
    }

    return res.json(record);
  } catch (error: any) {
    console.error('Error fetching knowledge base:', error);
    return res.status(500).json({
      error: 'Failed to fetch knowledge base settings',
      message: error.message
    });
  }
});

// POST /api/knowledge-base
router.post('/', verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { customHooks, customTemplates, bannedWords, brandVoiceTraining } = req.body;

    const [existing] = await db
      .select({ id: knowledgeBase.id })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.userId, req.user.id))
      .limit(1);

    if (existing) {
      await db
        .update(knowledgeBase)
        .set({
          customHooks: customHooks ?? [],
          customTemplates: customTemplates ?? [],
          bannedWords: bannedWords ?? [],
          brandVoiceTraining: brandVoiceTraining ?? "",
          updatedAt: new Date()
        })
        .where(eq(knowledgeBase.userId, req.user.id));
    } else {
      await db
        .insert(knowledgeBase)
        .values({
          userId: req.user.id,
          customHooks: customHooks ?? [],
          customTemplates: customTemplates ?? [],
          bannedWords: bannedWords ?? [],
          brandVoiceTraining: brandVoiceTraining ?? ""
        });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error saving knowledge base:', error);
    return res.status(500).json({
      error: 'Failed to save knowledge base settings',
      message: error.message
    });
  }
});

export default router;
