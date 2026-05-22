import { Router } from 'express';
import { and, desc, eq, sql, gte } from 'drizzle-orm';
import { db } from '../auth/auth';
import { articles, user, channels, socialPosts, contentSources, knowledgeBase } from '../auth/schema/schema';
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

// GET /api/articles/drafts/:draftId/slides/:index.png — dynamically serve slide image as raw PNG binary
router.get('/drafts/:draftId/slides/:index.png', async (req, res) => {
  try {
    const { draftId, index } = req.params;
    const slideIdx = parseInt(index, 10);

    if (!isUuid(draftId) || isNaN(slideIdx)) {
      res.status(400).send('Invalid params');
      return;
    }

    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, draftId))
      .limit(1);

    if (!post) {
      res.status(404).send('Post not found');
      return;
    }

    const content = post.content as any;
    if (content.type !== 'carousel' || !Array.isArray(content.slides)) {
      res.status(400).send('Not a carousel post');
      return;
    }

    const slide = content.slides[slideIdx];
    if (!slide || !slide.dataUri) {
      res.status(404).send('Slide not found');
      return;
    }

    const base64Data = slide.dataUri.split(';base64,').pop();
    if (!base64Data) {
      res.status(500).send('Invalid slide image data');
      return;
    }

    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': imgBuffer.length,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(imgBuffer);
  } catch (error: any) {
    console.error('[Articles] Serve slide error:', error);
    res.status(500).send('Internal server error');
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
    const contentGoal = req.body?.contentGoal;

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

    // Pre-check credits before calling LLM
    const [u] = await db.select({ tokens: user.tokens }).from(user).where(eq(user.id, userId)).limit(1);
    const tokens = u?.tokens ?? 0;
    if (tokens < ANGLE_EXTRACTION_COST) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: 'You need credits to extract angles from this article.',
      });
    }

    // Fetch user preferences for extraction
    const [kb] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.userId, userId)).limit(1);
    const [uPrefs] = await db.select({ topics: user.contentTopics }).from(user).where(eq(user.id, userId)).limit(1);

    const activeGoal = contentGoal || "Growing followers";
    const activeTopics = (uPrefs?.topics as string[]) || undefined;

    const ideas = await LLMService.extractAtomicIdeas(
      row.title,
      row.content,
      activeGoal,
      kb?.brandVoiceTraining || undefined,
      activeTopics
    );

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

    // Atomic credit deduction to prevent race conditions
    const [deducted] = await db
      .update(user)
      .set({ tokens: sql`${user.tokens} - ${ANGLE_EXTRACTION_COST}` })
      .where(and(eq(user.id, userId), gte(user.tokens, ANGLE_EXTRACTION_COST)))
      .returning({ tokens: user.tokens });

    if (!deducted) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: 'Credits were consumed by another request.',
      });
    }

    posthog.capture({
      distinctId: userId,
      event: 'angles_extracted',
      properties: {
        article_id: id,
        angles_count: ideas.length,
        credits_used: ANGLE_EXTRACTION_COST,
        credits_remaining: deducted.tokens,
      },
    });

    res.json({
      ideas,
      cached: false,
      anglesExtractedAt: now,
      creditsRemaining: deducted.tokens,
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
    const { selectedAngles, attachLink, generateCarousels } = req.body;

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
    const { UnsplashService } = await import('../services/unsplash');
    const { ImageRenderer } = await import('../services/imageRenderer');
    const { LLMService } = await import('../services/llm');

    for (const angle of selectedAngles) {
      const angleText = typeof angle === 'object' && angle !== null && 'idea' in angle ? (angle as any).idea : String(angle);
      for (const channel of activeChannels) {
        let newPostData;

        if (generateCarousels && (channel.platform === 'linkedin' || channel.platform === 'instagram')) {
          try {
            console.log(`[Articles] Generating carousel draft for ${channel.platform}`);
            const slidesData = await LLMService.generateCarouselDraft(angleText, article.title, article.content);
            const totalSlides = slidesData.length;
            const renderedSlides = [];

            for (let i = 0; i < totalSlides; i++) {
              const slide = slidesData[i];
              const isTitleSlide = i === 0;

              const backgroundUrl = await UnsplashService.fetchImageForKeyword(slide.imageSearchQuery || 'aesthetic');
              const dataUri = await ImageRenderer.renderCarouselSlide(
                slide.text,
                backgroundUrl,
                i + 1,
                totalSlides,
                '4:5',
                isTitleSlide
              );

              renderedSlides.push({
                text: slide.text,
                imageSearchQuery: slide.imageSearchQuery,
                backgroundUrl,
                dataUri
              });
            }

            let captionText = await LLMService.generateSocialDraft(
              channel.platform,
              angleText,
              article.title,
              article.content,
              writingStyle,
              userId
            );

            if (attachLink && article.url) {
              captionText += `\n\nRead the full article: ${article.url}`;
            }

            [newPostData] = await db
              .insert(socialPosts)
              .values({
                userId,
                articleId: id,
                channelId: channel.id,
                content: { type: 'carousel', slides: renderedSlides, text: captionText },
                status: 'draft',
              })
              .returning();
          } catch (carouselErr) {
            console.error(`[Articles] Failed to generate carousel for ${channel.platform}, falling back to text:`, carouselErr);
            // Fallback to text post if carousel fails
            let draftText = await LLMService.generateSocialDraft(
              channel.platform,
              angleText,
              article.title,
              article.content,
              writingStyle,
              userId
            );

            if (attachLink && article.url) {
              draftText += `\n\nRead the full article: ${article.url}`;
            }

            [newPostData] = await db
              .insert(socialPosts)
              .values({
                userId,
                articleId: id,
                channelId: channel.id,
                content: { text: draftText },
                status: 'draft',
              })
              .returning();
          }
        } else {
          // Standard text draft
          let draftText = await LLMService.generateSocialDraft(
            channel.platform,
            angleText,
            article.title,
            article.content,
            writingStyle,
            userId
          );

          if (attachLink && article.url) {
            draftText += `\n\nRead the full article: ${article.url}`;
          }

          [newPostData] = await db
            .insert(socialPosts)
            .values({
              userId,
              articleId: id,
              channelId: channel.id,
              content: { text: draftText },
              status: 'draft',
            })
            .returning();
        }

        generatedPosts.push({
          ...newPostData,
          channel: {
            id: channel.id,
            platform: channel.platform,
            accountName: channel.accountName,
            avatarUrl: channel.avatarUrl,
          }
        });
      }
    }

    // 5. Atomic credit deduction to prevent race conditions
    const [deducted] = await db
      .update(user)
      .set({ tokens: sql`${user.tokens} - ${cost}` })
      .where(and(eq(user.id, userId), gte(user.tokens, cost)))
      .returning({ tokens: user.tokens });

    if (!deducted) {
      return res.status(402).json({
        error: 'Insufficient credits',
        message: 'Credits were consumed by another request.',
      });
    }

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
        credits_remaining: deducted.tokens,
        attach_link: !!attachLink,
      },
    });

    res.json({
      success: true,
      drafts: generatedPosts,
      creditsRemaining: deducted.tokens,
    });
  } catch (error: any) {
    console.error('[Articles] Drafts generation error:', error);
    posthog.captureException(error, req.user!.id);
    res.status(500).json({ error: 'Failed to generate drafts', details: error.message });
  }
});

// POST /api/articles/:id/generate-carousel — generate a carousel from an atomic idea
router.post('/:id/generate-carousel', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { atomicIdea, channelId, aspectRatio = '4:5' } = req.body;

    if (!isUuid(id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!atomicIdea) {
      return res.status(400).json({ error: 'atomicIdea is required' });
    }

    // 1. Fetch the article
    const [article] = await db
      .select({ title: articles.title, content: articles.content })
      .from(articles)
      .where(and(eq(articles.id, id), eq(articles.userId, userId)))
      .limit(1);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // 2. Fetch the specific channel, or first active channel
    let channel;
    if (channelId) {
      [channel] = await db
        .select()
        .from(channels)
        .where(and(eq(channels.id, channelId), eq(channels.userId, userId)))
        .limit(1);
    } else {
      [channel] = await db
        .select()
        .from(channels)
        .where(eq(channels.userId, userId))
        .limit(1);
    }

    if (!channel) {
      return res.status(404).json({ error: 'No connected channels found' });
    }

    // 3. Generate carousel structured text via LLM
    const { LLMService } = await import('../services/llm');
    const slidesData = await LLMService.generateCarouselDraft(atomicIdea, article.title, article.content);

    // Fetch user style & write a companion caption!
    const [u] = await db.select({ writingStyle: user.writingStyle }).from(user).where(eq(user.id, userId)).limit(1);
    const writingStyle = u?.writingStyle ?? 'professional, engaging';

    const caption = await LLMService.generateSocialDraft(
      channel.platform,
      atomicIdea,
      article.title,
      article.content,
      writingStyle,
      userId
    );

    // 4. Generate the actual images for each slide using unique backgrounds
    const { UnsplashService } = await import('../services/unsplash');
    const { ImageRenderer } = await import('../services/imageRenderer');

    const totalSlides = slidesData.length;
    const renderedSlides = [];

    for (let i = 0; i < totalSlides; i++) {
      const slide = slidesData[i];
      const isTitleSlide = i === 0;

      // Fetch a unique background image using the keyword for this specific slide
      const backgroundUrl = await UnsplashService.fetchImageForKeyword(slide.imageSearchQuery || 'aesthetic');

      const dataUri = await ImageRenderer.renderCarouselSlide(
        slide.text,
        backgroundUrl,
        i + 1,
        totalSlides,
        aspectRatio,
        isTitleSlide
      );

      renderedSlides.push({
        text: slide.text,
        imageSearchQuery: slide.imageSearchQuery,
        backgroundUrl,
        dataUri // base64 PNG
      });
    }

    // 5. Save the generated carousel as a draft
    const [newPost] = await db
      .insert(socialPosts)
      .values({
        userId,
        articleId: id,
        channelId: channel.id,
        content: { type: 'carousel', slides: renderedSlides, text: caption },
        status: 'draft',
      })
      .returning();

    res.json({
      success: true,
      drafts: [{
        ...newPost,
        channel: {
          id: channel.id,
          platform: channel.platform,
          accountName: channel.accountName,
          avatarUrl: channel.avatarUrl,
        }
      }]
    });

  } catch (error: any) {
    console.error('[Articles] Carousel generation error:', error);
    res.status(500).json({ error: 'Failed to generate carousel', details: error.message });
  }
});

// POST /api/articles/drafts/:draftId/refresh-carousel-bg — refresh the background image for all slides in a carousel
router.post('/drafts/:draftId/refresh-carousel-bg', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;
    const { aspectRatio = '4:5' } = req.body;

    if (!isUuid(draftId)) {
      return res.status(400).json({ error: 'Invalid draft ID' });
    }

    // 1. Fetch the existing draft
    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const content = existing.content as any;
    if (content?.type !== 'carousel' || !Array.isArray(content.slides) || content.slides.length === 0) {
      return res.status(400).json({ error: 'Draft is not a valid carousel' });
    }

    // 2. Fetch NEW background images for each slide
    const { UnsplashService } = await import('../services/unsplash');
    const { ImageRenderer } = await import('../services/imageRenderer');

    // 3. Re-render all slides with the new backgrounds
    const totalSlides = content.slides.length;
    const renderedSlides = [];

    for (let i = 0; i < totalSlides; i++) {
      const slide = content.slides[i];
      const isTitleSlide = i === 0;

      // Fetch a unique background image using the keyword for this specific slide
      const newBackgroundUrl = await UnsplashService.fetchImageForKeyword(slide.imageSearchQuery || 'aesthetic');

      const dataUri = await ImageRenderer.renderCarouselSlide(
        slide.text,
        newBackgroundUrl,
        i + 1,
        totalSlides,
        aspectRatio,
        isTitleSlide
      );

      renderedSlides.push({
        ...slide,
        backgroundUrl: newBackgroundUrl,
        dataUri // updated base64 PNG
      });
    }

    // 4. Save the updated draft
    const [updatedPost] = await db
      .update(socialPosts)
      .set({ content: { ...content, slides: renderedSlides }, updatedAt: new Date() })
      .where(eq(socialPosts.id, draftId))
      .returning();

    res.json({
      success: true,
      draft: updatedPost
    });

  } catch (error: any) {
    console.error('[Articles] Carousel refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh carousel background', details: error.message });
  }
});

// POST /api/articles/drafts/:draftId/convert-to-carousel — convert a text draft into a carousel
router.post('/drafts/:draftId/convert-to-carousel', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { draftId } = req.params;
    const { aspectRatio = '4:5' } = req.body;

    if (!isUuid(draftId)) {
      return res.status(400).json({ error: 'Invalid draft ID' });
    }

    // 1. Fetch the existing draft
    const [existing] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.id, draftId), eq(socialPosts.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // 2. Fetch the article
    if (!existing.articleId) {
      return res.status(400).json({ error: 'No article associated with this draft' });
    }
    const [article] = await db
      .select({ title: articles.title, content: articles.content })
      .from(articles)
      .where(eq(articles.id, existing.articleId))
      .limit(1);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // 3. Extract draft text
    const content = existing.content as any;
    const draftText = content.text || '';
    if (!draftText.trim()) {
      return res.status(400).json({ error: 'Draft text content is empty' });
    }

    // 4. Generate slides text and image keywords
    const { LLMService } = await import('../services/llm');
    const slidesData = await LLMService.generateCarouselDraft(draftText, article.title, article.content);

    // 5. Render slides with background image from Unsplash
    const { UnsplashService } = await import('../services/unsplash');
    const { ImageRenderer } = await import('../services/imageRenderer');

    const totalSlides = slidesData.length;
    const renderedSlides = [];

    for (let i = 0; i < totalSlides; i++) {
      const slide = slidesData[i];
      const isTitleSlide = i === 0;

      const backgroundUrl = await UnsplashService.fetchImageForKeyword(slide.imageSearchQuery || 'aesthetic');

      const dataUri = await ImageRenderer.renderCarouselSlide(
        slide.text,
        backgroundUrl,
        i + 1,
        totalSlides,
        aspectRatio,
        isTitleSlide
      );

      renderedSlides.push({
        text: slide.text,
        imageSearchQuery: slide.imageSearchQuery,
        backgroundUrl,
        dataUri // base64 PNG
      });
    }

    // 6. Update the draft in DB
    const [updatedPost] = await db
      .update(socialPosts)
      .set({
        content: {
          type: 'carousel',
          slides: renderedSlides,
          text: draftText // Keep original text as post caption!
        },
        updatedAt: new Date()
      })
      .where(eq(socialPosts.id, draftId))
      .returning();

    // 7. Get channel details
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, existing.channelId))
      .limit(1);

    res.json({
      success: true,
      draft: {
        ...updatedPost,
        channel: channel ? {
          id: channel.id,
          platform: channel.platform,
          accountName: channel.accountName,
          avatarUrl: channel.avatarUrl,
        } : null
      }
    });

  } catch (error: any) {
    console.error('[Articles] Convert to carousel error:', error);
    res.status(500).json({ error: 'Failed to convert draft to carousel', details: error.message });
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

// Legacy endpoint — same logic as /drafts/:draftId (articleId is unused)
router.put('/:articleId/drafts/:draftId', verifyAuth, async (req: AuthRequest, res) => {
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
      return res.status(404).json({ error: 'Draft not found' });
    }

    const { text } = req.body;
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
