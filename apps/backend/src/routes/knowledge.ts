import { Router, Response } from 'express';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { db } from '../auth/auth';
import { knowledgeBase } from '../auth/schema/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// ─── Validation limits ──────────────────────────────────────────────────────
const MAX_HOOKS = 50;
const MAX_TEMPLATES = 50;
const MAX_BANNED_WORDS = 200;
const MAX_HOOK_LENGTH = 500;
const MAX_TEMPLATE_LENGTH = 2000;
const MAX_BANNED_WORD_LENGTH = 100;
const MAX_BRAND_VOICE_LENGTH = 5000;
const VALID_CHANNELS = ['linkedin', 'x', 'instagram', 'threads', 'facebook', 'bluesky'];

function isValidHook(h: unknown): h is { channel: string; hook: string } {
  if (typeof h !== 'object' || h === null) return false;
  const obj = h as Record<string, unknown>;
  return (
    typeof obj.channel === 'string' &&
    VALID_CHANNELS.includes(obj.channel) &&
    typeof obj.hook === 'string' &&
    obj.hook.length > 0 &&
    obj.hook.length <= MAX_HOOK_LENGTH
  );
}

function isValidTemplate(t: unknown): t is { channel: string; template: string } {
  if (typeof t !== 'object' || t === null) return false;
  const obj = t as Record<string, unknown>;
  return (
    typeof obj.channel === 'string' &&
    VALID_CHANNELS.includes(obj.channel) &&
    typeof obj.template === 'string' &&
    obj.template.length > 0 &&
    obj.template.length <= MAX_TEMPLATE_LENGTH
  );
}

function isValidBannedWord(w: unknown): w is string {
  return typeof w === 'string' && w.trim().length > 0 && w.length <= MAX_BANNED_WORD_LENGTH;
}

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
    console.error('[Knowledge] Error fetching:', error);
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

    // Validate and sanitize inputs
    const validatedHooks = Array.isArray(customHooks)
      ? customHooks.filter(isValidHook).slice(0, MAX_HOOKS)
      : [];

    const validatedTemplates = Array.isArray(customTemplates)
      ? customTemplates.filter(isValidTemplate).slice(0, MAX_TEMPLATES)
      : [];

    const validatedBannedWords = Array.isArray(bannedWords)
      ? bannedWords.filter(isValidBannedWord).map((w: string) => w.trim()).slice(0, MAX_BANNED_WORDS)
      : [];

    const validatedBrandVoice = typeof brandVoiceTraining === 'string'
      ? brandVoiceTraining.slice(0, MAX_BRAND_VOICE_LENGTH)
      : '';

    const [existing] = await db
      .select({ id: knowledgeBase.id })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.userId, req.user.id))
      .limit(1);

    const data = {
      customHooks: validatedHooks,
      customTemplates: validatedTemplates,
      bannedWords: validatedBannedWords,
      brandVoiceTraining: validatedBrandVoice,
    };

    if (existing) {
      await db
        .update(knowledgeBase)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(knowledgeBase.userId, req.user.id));
    } else {
      await db
        .insert(knowledgeBase)
        .values({ userId: req.user.id, ...data });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[Knowledge] Error saving:', error);
    return res.status(500).json({
      error: 'Failed to save knowledge base settings',
      message: error.message
    });
  }
});

export default router;
