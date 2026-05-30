import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../auth/auth';
import { articles, user, channels, socialPosts, contentSources } from '../auth/schema/schema';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { LLMService } from '../services/llm';
import { publishPostToSocialPlatform } from '../services/publisher';
import { posthog } from '../lib/posthog';

const router = Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id: string) {
  return UUID_RE.test(id);
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.filter((x) => typeof x === 'string' && x.trim().length > 0) as string[];
  return out.length ? out : null;
}

/** DB not migrated for angle columns yet (drizzle push incomplete). */
function isMissingAngleColumnsError(err: unknown): boolean {
  const parts: string[] = [];
  let cur: unknown = err;
  for (let i = 0; i < 6 && cur; i++) {
    const e = cur as { message?: string; cause?: unknown };
    if (e?.message) parts.push(e.message);
    cur = e?.cause;
  }
  const msg = parts.join(' ');
  return (
    /does not exist|unknown column/i.test(msg) &&
    (/extracted_angles/i.test(msg) || /angles_extracted_at/i.test(msg))
  );
}

const articleListCore = {
  id: articles.id,
  title: articles.title,
  url: articles.url,
  publishedAt: articles.publishedAt,
  sourceId: articles.sourceId,
  createdAt: articles.createdAt,
};

const articleListWithAngles = {
  ...articleListCore,
  extractedAngles: articles.extractedAngles,
  anglesExtractedAt: articles.anglesExtractedAt,
};

const articleRowCore = {
  id: articles.id,
  userId: articles.userId,
  sourceId: articles.sourceId,
  title: articles.title,
  content: articles.content,
  url: articles.url,
  publishedAt: articles.publishedAt,
  createdAt: articles.createdAt,
};

const articleRowWithAngles = {
  ...articleRowCore,
  extractedAngles: articles.extractedAngles,
  anglesExtractedAt: articles.anglesExtractedAt,
};

// GET /api/articles — recent issues for the signed-in user
router.get('/', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const sourceId = typeof req.query.sourceId === 'string' ? req.query.sourceId : undefined;

    const whereClause = sourceId && isUuid(sourceId)
      ? and(eq(articles.userId, userId), eq(articles.sourceId, sourceId))
      : eq(articles.userId, userId);

    let rows: {
      id: string;
      title: string;
      url: string | null;
      publishedAt: Date | null;
      sourceId: string | null;
      createdAt: Date;
      extractedAngles?: unknown;
      anglesExtractedAt?: Date | null;
      sourcePlatform?: string | null;
    }[];

    try {
      rows = await db
        .select({
          id: articles.id,
          title: articles.title,
          url: articles.url,
          publishedAt: articles.publishedAt,
          sourceId: articles.sourceId,
          createdAt: articles.createdAt,
          extractedAngles: articles.extractedAngles,
          anglesExtractedAt: articles.anglesExtractedAt,
          sourcePlatform: contentSources.platform,
        })
        .from(articles)
        .leftJoin(contentSources, eq(articles.sourceId, contentSources.id))
        .where(whereClause)
        .orderBy(desc(articles.publishedAt))
        .limit(limit);
    } catch (firstErr) {
      if (!isMissingAngleColumnsError(firstErr)) throw firstErr;
      console.warn('[Articles] Listing without angle columns — run drizzle-kit push (articles.extracted_angles, angles_extracted_at)');
      rows = await db
        .select({
          id: articles.id,
          title: articles.title,
          url: articles.url,
          publishedAt: articles.publishedAt,
          sourceId: articles.sourceId,
          createdAt: articles.createdAt,
          sourcePlatform: contentSources.platform,
        })
        .from(articles)
        .leftJoin(contentSources, eq(articles.sourceId, contentSources.id))
        .where(whereClause)
        .orderBy(desc(articles.publishedAt))
        .limit(limit);
    }

    // Fetch user's social posts with status = 'draft' to count drafts per article
    const userPosts = await db
      .select({ articleId: socialPosts.articleId, status: socialPosts.status })
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId));

    const draftsPerArticle = new Map<string, number>();
    for (const post of userPosts) {
      if (post.articleId && post.status === 'draft') {
        draftsPerArticle.set(post.articleId, (draftsPerArticle.get(post.articleId) || 0) + 1);
      }
    }

    const list = rows.map((r) => {
      const angles = asStringArray(r.extractedAngles);
      const draftCount = draftsPerArticle.get(r.id) || 0;
      return {
        id: r.id,
        title: r.title,
        url: r.url,
        publishedAt: r.publishedAt,
        sourceId: r.sourceId,
        createdAt: r.createdAt,
        angleCount: angles?.length ?? 0,
        anglesExtractedAt: r.anglesExtractedAt ?? null,
        draftCount,
        sourcePlatform: r.sourcePlatform ?? null,
      };
    });

    res.json({ articles: list });
  } catch (error: any) {
    console.error('[Articles] List error:', error);
    res.status(500).json({ error: 'Failed to list articles', details: error.message });
  }
});

// GET /api/articles/drafts/latest — fetch the most recent draft generation for the user
router.get('/drafts/latest', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // 1. Find the latest social post created by the user
    const [latestPost] = await db
      .select({ articleId: socialPosts.articleId })
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId))
      .orderBy(desc(socialPosts.createdAt))
      .limit(1);

    if (!latestPost || !latestPost.articleId) {
      return res.json({ article: null, drafts: [] });
    }

    // 2. Fetch the corresponding article
    const [article] = await db
      .select({ id: articles.id, title: articles.title, createdAt: articles.createdAt })
      .from(articles)
      .where(and(eq(articles.id, latestPost.articleId), eq(articles.userId, userId)))
      .limit(1);

    if (!article) {
      return res.json({ article: null, drafts: [] });
    }

    // 3. Fetch all drafts for this article
    const articleDrafts = await db
      .select({
        id: socialPosts.id,
        userId: socialPosts.userId,
        articleId: socialPosts.articleId,
        channelId: socialPosts.channelId,
        content: socialPosts.content,
        status: socialPosts.status,
        createdAt: socialPosts.createdAt,
        channel: {
          id: channels.id,
          platform: channels.platform,
          accountName: channels.accountName,
          avatarUrl: channels.avatarUrl,
        }
      })
      .from(socialPosts)
      .innerJoin(channels, eq(socialPosts.channelId, channels.id))
      .where(and(eq(socialPosts.articleId, article.id), eq(socialPosts.userId, userId)));

    res.json({
      article,
      drafts: articleDrafts
    });
  } catch (error: any) {
    console.error('[Articles] Get latest draft error:', error);
    res.status(500).json({ error: 'Failed to fetch latest draft', details: error.message });
  }
});

// GET /api/articles/drafts/active — fetch all active workspaces (articles with active drafts)
router.get('/drafts/active', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // 1. Find all active drafts for this user
    const activeDrafts = await db
      .select({
        id: socialPosts.id,
        userId: socialPosts.userId,
        articleId: socialPosts.articleId,
        channelId: socialPosts.channelId,
        content: socialPosts.content,
        status: socialPosts.status,
        createdAt: socialPosts.createdAt,
        channel: {
          id: channels.id,
          platform: channels.platform,
          accountName: channels.accountName,
          avatarUrl: channels.avatarUrl,
        },
        article: {
          id: articles.id,
          title: articles.title,
          createdAt: articles.createdAt,
        }
      })
      .from(socialPosts)
      .innerJoin(channels, eq(socialPosts.channelId, channels.id))
      .innerJoin(articles, eq(socialPosts.articleId, articles.id))
      .where(and(eq(socialPosts.userId, userId), eq(socialPosts.status, 'draft')));

    // 2. Group these drafts by article!
    const articleGroups = new Map<string, {
      article: { id: string; title: string; createdAt: Date };
      drafts: any[];
      lastEditedAt: Date;
    }>();

    for (const d of activeDrafts) {
      if (!d.articleId || !d.article) continue;
      const articleId = d.articleId;
      const postCreatedAt = d.createdAt ? new Date(d.createdAt) : new Date();

      if (!articleGroups.has(articleId)) {
        articleGroups.set(articleId, {
          article: d.article,
          drafts: [],
          lastEditedAt: postCreatedAt,
        });
      }

      const group = articleGroups.get(articleId)!;
      group.drafts.push({
        id: d.id,
        userId: d.userId,
        articleId: d.articleId,
        channelId: d.channelId,
        content: d.content,
        status: d.status,
        createdAt: d.createdAt,
        channel: d.channel,
      });

      if (postCreatedAt > group.lastEditedAt) {
        group.lastEditedAt = postCreatedAt;
      }
    }

    // 3. Convert map to array and sort by most recent lastEditedAt
    const workspaces = Array.from(articleGroups.values())
      .sort((a, b) => b.lastEditedAt.getTime() - a.lastEditedAt.getTime());

    res.json(workspaces);
  } catch (error: any) {
    console.error('[Articles] Fetch active workspaces error:', error);
    res.status(500).json({ error: 'Failed to fetch active workspaces', details: error.message });
  }
});

// GET /api/articles/:id — full article + cached angles
router.get('/:id', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    let row: {
      id: string;
      title: string;
      content: string;
      url: string | null;
      publishedAt: Date | null;
      sourceId: string | null;
      createdAt: Date;
      extractedAngles?: unknown;
      anglesExtractedAt?: Date | null;
    } | undefined;

    try {
      [row] = await db
        .select(articleRowWithAngles)
        .from(articles)
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
        .limit(1);
    } catch (firstErr) {
      if (!isMissingAngleColumnsError(firstErr)) throw firstErr;
      [row] = await db
        .select(articleRowCore)
        .from(articles)
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
        .limit(1);
    }

    if (!row) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const angles = asStringArray(row.extractedAngles);

    // Fetch existing drafts for this article with channel info
    const articleDrafts = await db
      .select({
        id: socialPosts.id,
        userId: socialPosts.userId,
        articleId: socialPosts.articleId,
        channelId: socialPosts.channelId,
        content: socialPosts.content,
        status: socialPosts.status,
        createdAt: socialPosts.createdAt,
        channel: {
          id: channels.id,
          platform: channels.platform,
          accountName: channels.accountName,
          avatarUrl: channels.avatarUrl,
        }
      })
      .from(socialPosts)
      .innerJoin(channels, eq(socialPosts.channelId, channels.id))
      .where(and(eq(socialPosts.articleId, id), eq(socialPosts.userId, userId)));

    res.json({
      article: {
        id: row.id,
        title: row.title,
        content: row.content,
        url: row.url,
        publishedAt: row.publishedAt,
        sourceId: row.sourceId,
        createdAt: row.createdAt,
        angles: angles ?? [],
        anglesExtractedAt: row.anglesExtractedAt ?? null,
      },
      drafts: articleDrafts,
    });
  } catch (error: any) {
    console.error('[Articles] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch article', details: error.message });
  }
});

const ANGLE_EXTRACTION_COST = 1;

// POST /api/articles/:id/ideas — extract atomic ideas (angles); uses cache unless force=true
router.post('/:id/ideas', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const force = req.body?.force === true;

    if (!isUuid(id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    let row: {
      id: string;
      title: string;
      content: string;
      extractedAngles?: unknown;
      anglesExtractedAt?: Date | null;
    } | undefined;

    try {
      [row] = await db
        .select({
          id: articles.id,
          title: articles.title,
          content: articles.content,
          extractedAngles: articles.extractedAngles,
          anglesExtractedAt: articles.anglesExtractedAt,
        })
        .from(articles)
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
        .limit(1);
    } catch (firstErr) {
      if (!isMissingAngleColumnsError(firstErr)) throw firstErr;
      [row] = await db
        .select({
          id: articles.id,
          title: articles.title,
          content: articles.content,
        })
        .from(articles)
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
        .limit(1);
    }

    if (!row) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existing = asStringArray(row.extractedAngles);
    if (existing && existing.length > 0 && !force) {
      return res.json({
        ideas: existing,
        cached: true,
        anglesExtractedAt: row.anglesExtractedAt,
      });
    }

    const plain = row.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length < 80) {
      return res.status(400).json({
        error: 'Article body is too short to extract angles. Try syncing a full post.',
      });
    }

    const [u] = await db.select({ tokens: user.tokens }).from(user).where(eq(user.id, userId)).limit(1);
    const tokens = u?.tokens ?? 0;
    if (tokens < ANGLE_EXTRACTION_COST) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: 'You need credits to extract angles from this article.',
      });
    }

    const ideas = await LLMService.extractAtomicIdeas(row.title, row.content);

    if (!ideas.length) {
      return res.status(502).json({ error: 'No angles could be extracted. Try again.' });
    }

    const now = new Date();
    try {
      await db
        .update(articles)
        .set({ extractedAngles: ideas, anglesExtractedAt: now })
        .where(and(eq(articles.id, id), eq(articles.userId, userId)));
    } catch (updErr) {
      if (isMissingAngleColumnsError(updErr)) {
        return res.status(503).json({
          error: 'Database needs angle columns',
          message:
            'Run `npx drizzle-kit push` in apps/backend (add articles.extracted_angles and angles_extracted_at), or apply the SQL migration in apps/backend/sql/add_article_angles.sql',
        });
      }
      throw updErr;
    }


    const newTokens = tokens - ANGLE_EXTRACTION_COST;
    await db.update(user).set({ tokens: newTokens }).where(eq(user.id, userId));

    posthog.capture({
      distinctId: userId,
      event: 'angles_extracted',
      properties: {
        article_id: id,
        angles_count: ideas.length,
        credits_used: ANGLE_EXTRACTION_COST,
        credits_remaining: newTokens,
      },
    });

    res.json({
      ideas,
      cached: false,
      anglesExtractedAt: now,
      creditsRemaining: newTokens,
    });
  } catch (error: any) {
    console.error('[Articles] Ideas extraction error:', error);
    posthog.captureException(error, req.user!.id);
    res.status(500).json({ error: 'Failed to extract ideas', details: error.message });
  }
});

// POST /api/articles/:id/drafts — generate platform-native drafts from selected angles
router.post('/:id/drafts', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { selectedAngles, attachLink } = req.body;

    if (!isUuid(id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!Array.isArray(selectedAngles) || selectedAngles.length === 0) {
      return res.status(400).json({ error: 'No angles selected for drafting' });
    }

    // 1. Fetch the article
    let article: { title: string; content: string; url: string | null } | undefined;
    try {
      [article] = await db
        .select({ title: articles.title, content: articles.content, url: articles.url })
        .from(articles)
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
        .limit(1);
    } catch (dbErr) {
      throw dbErr;
    }

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // 2. Fetch user's active connected channels
    const activeChannels = await db
      .select()
      .from(channels)
      .where(eq(channels.userId, userId));

    if (activeChannels.length === 0) {
      return res.status(400).json({
        error: 'No connected channels',
        message: 'Please connect at least one channel (e.g., LinkedIn or X) in the Connections tab before generating drafts.',
      });
    }

    // 3. Check credits balance
    const [u] = await db.select({ tokens: user.tokens, writingStyle: user.writingStyle }).from(user).where(eq(user.id, userId)).limit(1);
    const tokens = u?.tokens ?? 0;
    const writingStyle = u?.writingStyle ?? 'professional, engaging';
    
    const cost = selectedAngles.length * activeChannels.length;
    if (tokens < cost) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: `You need ${cost} credits to generate drafts (${selectedAngles.length} angle(s) × ${activeChannels.length} channel(s)), but you only have ${tokens}.`,
      });
    }

    // 4. Generate drafts for each angle and channel
    const generatedPosts: any[] = [];
    for (const angle of selectedAngles) {
      for (const channel of activeChannels) {
        let draftText = await LLMService.generateSocialDraft(
          channel.platform,
          angle,
          article.title,
          article.content,
          writingStyle,
          userId
        );

        if (attachLink && article.url) {
          draftText += `\n\nRead the full article: ${article.url}`;
        }

        const [newPost] = await db
          .insert(socialPosts)
          .values({
            userId,
            articleId: id,
            channelId: channel.id,
            content: { text: draftText },
            status: 'draft',
          })
          .returning();

        generatedPosts.push({
          ...newPost,
          channel: {
            id: channel.id,
            platform: channel.platform,
            accountName: channel.accountName,
            avatarUrl: channel.avatarUrl,
          }
        });
      }
    }

    // 5. Deduct credits
    const newTokens = tokens - cost;
    await db.update(user).set({ tokens: newTokens }).where(eq(user.id, userId));

    posthog.capture({
      distinctId: userId,
      event: 'drafts_generated',
      properties: {
        article_id: id,
        angles_count: selectedAngles.length,
        channels_count: activeChannels.length,
        drafts_count: generatedPosts.length,
        platforms: activeChannels.map((c) => c.platform),
        credits_used: cost,
        credits_remaining: newTokens,
        attach_link: !!attachLink,
      },
    });

    res.json({
      success: true,
      drafts: generatedPosts,
      creditsRemaining: newTokens,
    });
  } catch (error: any) {
    console.error('[Articles] Drafts generation error:', error);
    posthog.captureException(error, req.user!.id);
    res.status(500).json({ error: 'Failed to generate drafts', details: error.message });
  }
});

// PUT /api/articles/drafts/:draftId — update a draft's content directly (used by Post Queue)
router.put('/drafts/:draftId', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;
    const { text } = req.body;

    if (!isUuid(draftId)) {
      return res.status(400).json({ error: 'Invalid draft ID' });
    }

    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const sanitizedText = typeof text === 'string' ? text.replace(/\u2014/g, '-').replace(/—/g, '-') : text;

    const [updated] = await db
      .update(socialPosts)
      .set({ content: { text: sanitizedText } })
      .where(eq(socialPosts.id, draftId))
      .returning();

    res.json({ success: true, draft: updated });
  } catch (error: any) {
    console.error('[Articles] Update draft error:', error);
    res.status(500).json({ error: 'Failed to update draft', details: error.message });
  }
});

// PUT /api/articles/:articleId/drafts/:draftId — update a draft's content
router.put('/:articleId/drafts/:draftId', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { articleId, draftId } = req.params;
    const { text } = req.body;

    if (!isUuid(articleId) || !isUuid(draftId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const sanitizedText = typeof text === 'string' ? text.replace(/\u2014/g, '-').replace(/—/g, '-') : text;

    const [updated] = await db
      .update(socialPosts)
      .set({ content: { text: sanitizedText } })
      .where(eq(socialPosts.id, draftId))
      .returning();

    res.json({ success: true, draft: updated });
  } catch (error: any) {
    console.error('[Articles] Update draft error:', error);
    res.status(500).json({ error: 'Failed to update draft', details: error.message });
  }
});

// GET /api/articles/drafts/queue — fetch all scheduled/published posts
router.get('/drafts/queue', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const posts = await db
      .select({
        id: socialPosts.id,
        articleId: socialPosts.articleId,
        channelId: socialPosts.channelId,
        content: socialPosts.content,
        status: socialPosts.status,
        scheduledAt: socialPosts.scheduledAt,
        publishedAt: socialPosts.publishedAt,
        createdAt: socialPosts.createdAt,
        channel: {
          id: channels.id,
          platform: channels.platform,
          accountName: channels.accountName,
          avatarUrl: channels.avatarUrl,
        },
        article: {
          id: articles.id,
          title: articles.title,
        }
      })
      .from(socialPosts)
      .leftJoin(channels, eq(socialPosts.channelId, channels.id))
      .leftJoin(articles, eq(socialPosts.articleId, articles.id))
      .where(eq(socialPosts.userId, userId))
      .orderBy(desc(socialPosts.scheduledAt), desc(socialPosts.createdAt));

    res.json(posts);
  } catch (error: any) {
    console.error('[Articles] Fetch queue error:', error);
    res.status(500).json({ error: 'Failed to fetch queue', details: error.message });
  }
});

// POST /api/articles/drafts/:draftId/schedule — schedule a post
router.post('/drafts/:draftId/schedule', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;
    const { scheduledAt } = req.body;

    if (!isUuid(draftId)) {
      return res.status(400).json({ error: 'Invalid draft ID' });
    }

    if (!scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt is required' });
    }

    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const [updated] = await db
      .update(socialPosts)
      .set({
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, draftId))
      .returning();

    posthog.capture({
      distinctId: userId,
      event: 'post_scheduled',
      properties: {
        draft_id: draftId,
        scheduled_at: scheduledAt,
        channel_id: existing.channelId,
        article_id: existing.articleId,
      },
    });

    res.json({ success: true, post: updated });
  } catch (error: any) {
    console.error('[Articles] Schedule post error:', error);
    posthog.captureException(error, req.user!.id);
    res.status(500).json({ error: 'Failed to schedule post', details: error.message });
  }
});

// POST /api/articles/drafts/:draftId/unschedule — unschedule a post
router.post('/drafts/:draftId/unschedule', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;

    if (!isUuid(draftId)) {
      return res.status(400).json({ error: 'Invalid draft ID' });
    }

    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const [updated] = await db
      .update(socialPosts)
      .set({
        status: 'draft',
        scheduledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, draftId))
      .returning();

    res.json({ success: true, post: updated });
  } catch (error: any) {
    console.error('[Articles] Unschedule post error:', error);
    res.status(500).json({ error: 'Failed to unschedule post', details: error.message });
  }
});

// POST /api/articles/drafts/:draftId/publish-now — publish a post immediately
router.post('/drafts/:draftId/publish-now', verifyAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const { draftId } = req.params;

    if (!isUuid(draftId)) {
      return res.status(400).json({ error: 'Invalid draft ID' });
    }

    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await publishPostToSocialPlatform(draftId);

    const [updated] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, draftId))
      .limit(1);

    posthog.capture({
      distinctId: userId,
      event: 'post_published',
      properties: {
        draft_id: draftId,
        channel_id: existing.channelId,
        article_id: existing.articleId,
      },
    });

    res.json({ success: true, post: updated });
  } catch (error: any) {
    console.error('[Articles] Publish post error:', error);
    posthog.captureException(error, userId);
    res.status(500).json({ error: 'Failed to publish post', details: error.message });
  }
});

// DELETE /api/articles/drafts/:draftId — delete a post
router.delete('/drafts/:draftId', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;

    if (!isUuid(draftId)) {
      return res.status(400).json({ error: 'Invalid draft ID' });
    }

    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await db
      .delete(socialPosts)
      .where(eq(socialPosts.id, draftId));

    posthog.capture({
      distinctId: userId,
      event: 'post_deleted',
      properties: {
        draft_id: draftId,
        channel_id: existing.channelId,
        article_id: existing.articleId,
        previous_status: existing.status,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Articles] Delete post error:', error);
    posthog.captureException(error, req.user!.id);
    res.status(500).json({ error: 'Failed to delete post', details: error.message });
  }
});

export default router;
