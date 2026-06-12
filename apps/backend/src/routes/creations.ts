import { Router, Response } from "express";
import { and, desc, eq, inArray, sql, type InferSelectModel } from "drizzle-orm";
import { db } from "../auth/auth";
import { articles, channels, contentSources, creationSessions, knowledgeBase, socialPosts, user } from "../auth/schema/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";
import { buildScheduledDraftContent, extractCarouselPlatforms, findCreationDraftIndex, normalizeCreationDrafts } from "../agentic/creation-drafts";
import { type CreationDraft } from "../agentic/types";
import { markCarouselRenderFailure, renderCreationDraftCarousel, createCarouselRenderProvider } from "../carousels/render-carousel";
import { generateCreationDrafts } from "../services/creation-service";
import { posthog } from "../lib/posthog";

const router = Router();

type ArticleRecord = InferSelectModel<typeof articles>;
type ChannelRecord = InferSelectModel<typeof channels>;
type ContentSourceRecord = InferSelectModel<typeof contentSources>;
type CreationSessionRecord = InferSelectModel<typeof creationSessions>;

interface CreateCreationBody {
  sourceId?: string;
  articleId?: string;
  selectedAngles?: unknown;
  selectedChannelIds?: unknown;
  carouselPlatforms?: unknown;
  draftCount?: unknown;
  userGoals?: string;
}

interface UpdateCreationBody {
  drafts?: unknown;
}

interface RenderCarouselBody {
  draft?: unknown;
  variantNumber?: unknown;
}

interface ScheduleDraftBody {
  scheduledAt?: unknown;
  text?: unknown;
  variantNumber?: unknown;
}

interface CreationSessionPayload {
  id: string;
  source: {
    id: string | null;
    platform: string | null;
    url: string | null;
  } | null;
  article: {
    id: string;
    title: string;
    url: string | null;
    publishedAt: string | null;
  } | null;
  selectedAngles: string[];
  selectedChannels: Array<{
    id: string;
    platform: string;
    accountName: string;
    avatarUrl: string | null;
  }>;
  draftCountPerChannel: number;
  drafts: CreationDraft[];
  metadata: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreationSessionSummaryPayload {
  id: string;
  articleTitle: string;
  articleUrl: string | null;
  sourceUrl: string | null;
  draftCount: number;
  draftCountPerChannel: number;
  createdAt: string;
  updatedAt: string;
}

function normalizeVoiceMemory(rawVoiceMemory: unknown): {
  sources: Array<{ category: string; label?: string; content: string; url?: string | null }>;
  profile: Record<string, string>;
  strictness: number;
  status: string;
  lastLearnedAt: string | null;
  lastLearnedSourceId: string | null;
} {
  if (typeof rawVoiceMemory !== "object" || rawVoiceMemory === null) {
    return {
      sources: [],
      profile: {},
      strictness: 50,
      status: "idle",
      lastLearnedAt: null,
      lastLearnedSourceId: null,
    };
  }

  const voiceMemory = rawVoiceMemory as Record<string, unknown>;
  return {
    sources: Array.isArray(voiceMemory.sources)
      ? voiceMemory.sources
          .filter((item) => typeof item === "object" && item !== null)
          .map((item) => {
            const source = item as Record<string, unknown>;
            return {
              category: typeof source.category === "string" ? source.category : "newsletter",
              label: typeof source.label === "string" ? source.label : undefined,
              content: typeof source.content === "string" ? source.content : "",
              url: typeof source.url === "string" ? source.url : null,
            };
          })
      : [],
    profile: typeof voiceMemory.profile === "object" && voiceMemory.profile !== null ? voiceMemory.profile as Record<string, string> : {},
    strictness: typeof voiceMemory.strictness === "number" ? voiceMemory.strictness : 50,
    status: typeof voiceMemory.status === "string" ? voiceMemory.status : "idle",
    lastLearnedAt: typeof voiceMemory.lastLearnedAt === "string" ? voiceMemory.lastLearnedAt : null,
    lastLearnedSourceId: typeof voiceMemory.lastLearnedSourceId === "string" ? voiceMemory.lastLearnedSourceId : null,
  };
}

function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function extractDraftCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.floor(value)));
}

function buildCreationSessionPayload(params: {
  session: CreationSessionRecord;
  source?: ContentSourceRecord;
  article?: ArticleRecord;
  selectedChannels: ChannelRecord[];
}): CreationSessionPayload {
  const { session, source, article, selectedChannels } = params;
  const normalizedDrafts = normalizeCreationDrafts(session.drafts);
  const draftCountPerChannel =
    selectedChannels.length > 0
      ? Math.max(1, Math.ceil(normalizedDrafts.length / selectedChannels.length))
      : normalizedDrafts.length;

  return {
    id: session.id,
    source: source
      ? {
          id: source.id,
          platform: source.platform,
          url: source.url ?? null,
        }
      : null,
    article: article
      ? {
          id: article.id,
          title: article.title,
          url: article.url ?? null,
          publishedAt: article.publishedAt
            ? (article.publishedAt instanceof Date
                ? article.publishedAt.toISOString()
                : new Date(article.publishedAt).toISOString())
            : null,
        }
      : null,
    selectedAngles: extractStringArray(session.selectedAngles),
    selectedChannels: selectedChannels.map((channel) => ({
      id: channel.id,
      platform: channel.platform,
      accountName: channel.accountName ?? channel.platform,
      avatarUrl: channel.avatarUrl ?? null,
    })),
    draftCountPerChannel,
    drafts: normalizedDrafts,
    metadata: session.metadata ?? null,
    status: session.status,
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : new Date(session.createdAt || Date.now()).toISOString(),
    updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : new Date(session.updatedAt || Date.now()).toISOString(),
  };
}

function buildCreationSessionSummaryPayload(params: {
  session: CreationSessionRecord;
  article?: ArticleRecord;
  source?: ContentSourceRecord;
}): CreationSessionSummaryPayload {
  const { session, article, source } = params;
  const normalizedDrafts = normalizeCreationDrafts(session.drafts);
  const selectedChannelCount = extractStringArray(session.selectedChannelIds).length;

  return {
    id: session.id,
    articleTitle: article?.title ?? "Untitled creation",
    articleUrl: article?.url ?? null,
    sourceUrl: source?.url ?? null,
    draftCount: normalizedDrafts.length,
    draftCountPerChannel:
      selectedChannelCount > 0
        ? Math.max(1, Math.ceil(normalizedDrafts.length / selectedChannelCount))
        : normalizedDrafts.length,
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : new Date(session.createdAt || Date.now()).toISOString(),
    updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : new Date(session.updatedAt || Date.now()).toISOString(),
  };
}

function extractVariantNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

/**
 * Creates and persists a saved draft generation session.
 */
router.post("/", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { sourceId, articleId, selectedAngles, selectedChannelIds, carouselPlatforms, draftCount, userGoals } = req.body as CreateCreationBody;
    const normalizedAngles = extractStringArray(selectedAngles);
    const normalizedChannelIds = extractStringArray(selectedChannelIds);
    const normalizedDraftCount = extractDraftCount(draftCount);

    if (!articleId) {
      return res.status(400).json({ error: "articleId is required" });
    }

    if (normalizedAngles.length === 0) {
      return res.status(400).json({ error: "Select at least one angle" });
    }

    if (normalizedChannelIds.length === 0) {
      return res.status(400).json({ error: "Select at least one social channel" });
    }

    const [article] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.userId, req.user.id), eq(articles.id, articleId)))
      .limit(1);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    const [source] = sourceId
      ? await db
          .select()
          .from(contentSources)
          .where(and(eq(contentSources.userId, req.user.id), eq(contentSources.id, sourceId)))
          .limit(1)
      : [];

    if (sourceId && !source) {
      return res.status(404).json({ error: "Selected source not found" });
    }

    const selectedChannels = await db
      .select()
      .from(channels)
      .where(and(
        eq(channels.userId, req.user.id),
        inArray(channels.id, normalizedChannelIds),
        eq(channels.isConnected, true)
      ));

    if (selectedChannels.length !== normalizedChannelIds.length) {
      return res.status(400).json({ error: "One or more selected channels could not be found" });
    }

    const orderedChannels = normalizedChannelIds
      .map((channelId) => selectedChannels.find((channel) => channel.id === channelId))
      .filter((channel): channel is ChannelRecord => Boolean(channel));
    const normalizedCarouselPlatforms = extractCarouselPlatforms(carouselPlatforms)
      .filter((platform) => orderedChannels.some((channel) => channel.platform === platform));

    const [currentKnowledgeBase] = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.userId, req.user.id))
      .limit(1);

    const sourceLookupId = source?.id ?? article.sourceId ?? null;
    const sourceArticleRows = sourceLookupId
      ? await db
          .select({
            title: articles.title,
            content: articles.content,
            url: articles.url,
          })
          .from(articles)
          .where(and(eq(articles.userId, req.user.id), eq(articles.sourceId, sourceLookupId)))
          .orderBy(desc(articles.publishedAt))
          .limit(6)
      : [];

    const brandVoiceTraining =
      currentKnowledgeBase?.brandVoiceTraining?.trim() ||
      "Write with a clear creator voice that stays native to the selected platform.";

    const generationResult = await generateCreationDrafts({
      articleTitle: article.title,
      articleContent: article.content,
      brandVoiceTraining,
      selectedAngles: normalizedAngles,
      channels: orderedChannels.map((channel) => ({
        id: channel.id,
        platform: channel.platform,
        accountName: channel.accountName ?? null,
      })),
      carouselPlatforms: normalizedCarouselPlatforms,
      draftCount: normalizedDraftCount,
      sourceArticleSamples: sourceArticleRows.map((row) => ({
        title: row.title,
        content: row.content,
        url: row.url ?? null,
      })),
      knowledge: {
        brandVoiceTraining,
        voiceMemory: normalizeVoiceMemory(currentKnowledgeBase?.voiceMemory ?? null),
        customHooks: Array.isArray(currentKnowledgeBase?.customHooks) ? currentKnowledgeBase.customHooks as Array<{ channel: string; hook: string }> : [],
        customTemplates: Array.isArray(currentKnowledgeBase?.customTemplates) ? currentKnowledgeBase.customTemplates as Array<{ channel: string; template: string }> : [],
        bannedWords: Array.isArray(currentKnowledgeBase?.bannedWords) ? currentKnowledgeBase.bannedWords as string[] : [],
      },
      userId: req.user.id,
      creatorId: req.user.id,
      userGoals: typeof userGoals === "string" ? userGoals : undefined,
    });

    const [createdSession] = await db
      .insert(creationSessions)
      .values({
        userId: req.user.id,
        sourceId: source?.id ?? article.sourceId ?? null,
        articleId: article.id,
        selectedAngles: normalizedAngles,
        selectedChannelIds: normalizedChannelIds,
        drafts: generationResult.drafts,
        metadata: generationResult.metadata,
        status: "ready",
      })
      .returning({ id: creationSessions.id });

    posthog.capture({
      distinctId: req.user.id,
      event: "creation_session_created",
      properties: {
        creation_id: createdSession.id,
        article_id: article.id,
        draft_count: generationResult.drafts.length,
        channel_count: normalizedChannelIds.length,
        platforms: orderedChannels.map((c) => c.platform),
        carousel_platforms: normalizedCarouselPlatforms,
        angle_count: normalizedAngles.length,
      },
    });

    return res.status(201).json({ creationId: createdSession.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create draft session";
    return res.status(500).json({ error: message });
  }
});

/**
 * Lists previously saved creation sessions for the current user.
 */
router.get("/", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await db
      .select()
      .from(creationSessions)
      .where(eq(creationSessions.userId, req.user.id))
      .orderBy(desc(creationSessions.updatedAt), desc(creationSessions.createdAt));

    const articleIds = Array.from(new Set(
      sessions
        .map((session) => session.articleId)
        .filter((articleId): articleId is string => typeof articleId === "string" && articleId.length > 0),
    ));
    const sourceIds = Array.from(new Set(
      sessions
        .map((session) => session.sourceId)
        .filter((sourceId): sourceId is string => typeof sourceId === "string" && sourceId.length > 0),
    ));

    const relatedArticles = articleIds.length > 0
      ? await db
          .select()
          .from(articles)
          .where(and(eq(articles.userId, req.user.id), inArray(articles.id, articleIds)))
      : [];
    const relatedSources = sourceIds.length > 0
      ? await db
          .select()
          .from(contentSources)
          .where(and(eq(contentSources.userId, req.user.id), inArray(contentSources.id, sourceIds)))
      : [];

    const creations = sessions.map((session) => buildCreationSessionSummaryPayload({
      session,
      article: relatedArticles.find((article) => article.id === session.articleId),
      source: relatedSources.find((source) => source.id === session.sourceId),
    }));

    return res.json({ creations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch creations";
    return res.status(500).json({ error: message });
  }
});

/**
 * Returns a saved draft generation session for the current user.
 */
router.get("/:creationId", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [session] = await db
      .select()
      .from(creationSessions)
      .where(and(eq(creationSessions.userId, req.user.id), eq(creationSessions.id, req.params.creationId)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Creation not found" });
    }

    const [article] = session.articleId
      ? await db
          .select()
          .from(articles)
          .where(and(eq(articles.userId, req.user.id), eq(articles.id, session.articleId)))
          .limit(1)
      : [];

    const [source] = session.sourceId
      ? await db
          .select()
          .from(contentSources)
          .where(and(eq(contentSources.userId, req.user.id), eq(contentSources.id, session.sourceId)))
          .limit(1)
      : [];

    const selectedChannelIds = extractStringArray(session.selectedChannelIds);
    const activeChannels = await db
      .select()
      .from(channels)
      .where(and(eq(channels.userId, req.user.id), eq(channels.isConnected, true)));

    const resolvedChannels: ChannelRecord[] = [];
    const draftsList = normalizeCreationDrafts(session.drafts);

    if (draftsList.length > 0) {
      for (const draft of draftsList) {
        let activeChan = activeChannels.find((c) => c.id === draft.channelId);
        if (!activeChan) {
          activeChan = activeChannels.find((c) => c.platform === draft.platform);
        }
        if (activeChan) {
          if (!resolvedChannels.some((c) => c.id === draft.channelId)) {
            resolvedChannels.push({
              ...activeChan,
              id: draft.channelId, // Keep expected ID for frontend join
            });
          }
        }
      }
    } else {
      const referencedChannels = selectedChannelIds.length > 0
        ? await db
            .select()
            .from(channels)
            .where(and(eq(channels.userId, req.user.id), inArray(channels.id, selectedChannelIds)))
        : [];

      for (const channelId of selectedChannelIds) {
        let activeChan = activeChannels.find((c) => c.id === channelId);
        if (!activeChan) {
          const refChan = referencedChannels.find((c) => c.id === channelId);
          if (refChan) {
            activeChan = activeChannels.find((c) => c.platform === refChan.platform);
          }
        }
        if (activeChan) {
          if (!resolvedChannels.some((c) => c.id === channelId)) {
            resolvedChannels.push({
              ...activeChan,
              id: channelId,
            });
          }
        }
      }
    }

    return res.json({
      creation: buildCreationSessionPayload({
        session,
        source,
        article,
        selectedChannels: resolvedChannels,
      }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch creation";
    return res.status(500).json({ error: message });
  }
});

/**
 * Updates the saved drafts for a creation session.
 */
router.put("/:creationId", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { drafts } = req.body as UpdateCreationBody;
    const normalizedDrafts = normalizeCreationDrafts(drafts);

    if (normalizedDrafts.length === 0) {
      return res.status(400).json({ error: "drafts are required" });
    }

    const [existingSession] = await db
      .select()
      .from(creationSessions)
      .where(and(eq(creationSessions.userId, req.user.id), eq(creationSessions.id, req.params.creationId)))
      .limit(1);

    if (!existingSession) {
      return res.status(404).json({ error: "Creation not found" });
    }

    await db
      .update(creationSessions)
      .set({
        drafts: normalizedDrafts,
        updatedAt: new Date(),
      })
      .where(eq(creationSessions.id, existingSession.id));

    return res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update creation";
    return res.status(500).json({ error: message });
  }
});

/**
 * Schedules a draft from a creation session into the social posts calendar.
 */
router.post("/:creationId/drafts/:channelId/schedule", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { creationId, channelId } = req.params;
    const { scheduledAt, text, variantNumber } = req.body as ScheduleDraftBody;
    const normalizedVariantNumber = extractVariantNumber(variantNumber);

    if (typeof scheduledAt !== "string" || !scheduledAt) {
      return res.status(400).json({ error: "scheduledAt is required and must be a string" });
    }

    const [session] = await db
      .select()
      .from(creationSessions)
      .where(and(eq(creationSessions.userId, req.user.id), eq(creationSessions.id, creationId)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Creation session not found" });
    }

    const drafts = normalizeCreationDrafts(session.drafts);
    const draftIndex = findCreationDraftIndex(drafts, channelId, normalizedVariantNumber);
    const draft = drafts[draftIndex];
    if (!draft) {
      return res.status(404).json({ error: "Draft not found for this channel" });
    }

    // Resolve active channel ID in case the channel was disconnected/reconnected (meaning the ID in the drafts JSONB is stale)
    let targetChannelId = channelId;
    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(and(
        eq(channels.id, channelId),
        eq(channels.userId, req.user.id),
        eq(channels.isConnected, true)
      ))
      .limit(1);

    if (!existingChannel) {
      // Find any connected channel for this platform/user
      const userActiveChannels = await db
        .select()
        .from(channels)
        .where(and(
          eq(channels.userId, req.user.id),
          eq(channels.platform, draft.platform),
          eq(channels.isConnected, true)
        ));

      if (userActiveChannels.length > 0) {
        targetChannelId = userActiveChannels[0].id;
      } else {
        return res.status(400).json({
          error: "Channel disconnected",
          message: `Please connect your ${draft.platform} account before scheduling.`
        });
      }
    }

    const draftText = typeof text === "string" ? text : draft.text;
    const content = buildScheduledDraftContent(draft, draftText);

    // Check if this is the user's first scheduled post
    const existingPosts = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(eq(socialPosts.userId, req.user.id))
      .limit(1);

    const isFirstSchedule = existingPosts.length === 0;

    const [newPost] = await db
      .insert(socialPosts)
      .values({
        userId: req.user.id,
        articleId: session.articleId,
        channelId: targetChannelId,
        content,
        status: "scheduled",
        scheduledAt: new Date(scheduledAt),
      })
      .returning();

    posthog.capture({
      distinctId: req.user.id,
      event: "post_scheduled",
      properties: {
        post_id: newPost.id,
        creation_id: creationId,
        channel_id: targetChannelId,
        platform: draft.platform,
        is_first_post: isFirstSchedule,
        scheduled_at: scheduledAt,
      },
    });

    let firstScheduledPostRewarded = false;
    if (isFirstSchedule) {
      const [currentUser] = await db
        .select({ tokens: user.tokens })
        .from(user)
        .where(eq(user.id, req.user.id))
        .limit(1);

      if (currentUser) {
        await db
          .update(user)
          .set({ tokens: (currentUser.tokens ?? 0) + 10 })
          .where(eq(user.id, req.user.id));
        firstScheduledPostRewarded = true;
      }
    }

    return res.status(200).json({ success: true, post: newPost, firstScheduledPostRewarded });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to schedule draft";
    return res.status(500).json({ error: message });
  }
});

/**
 * Renders or re-renders carousel visuals for a saved creation draft.
 */
router.post("/:creationId/drafts/:channelId/carousel/render", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { creationId, channelId } = req.params;
    const { draft: inputDraft, variantNumber } = req.body as RenderCarouselBody;
    const normalizedVariantNumber = extractVariantNumber(
      typeof inputDraft === "object" && inputDraft !== null
        ? (inputDraft as { variantNumber?: unknown }).variantNumber
        : variantNumber,
    );

    const [session] = await db
      .select()
      .from(creationSessions)
      .where(and(eq(creationSessions.userId, req.user.id), eq(creationSessions.id, creationId)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Creation session not found" });
    }

    const drafts = normalizeCreationDrafts(session.drafts);
    const draftIndex = findCreationDraftIndex(drafts, channelId, normalizedVariantNumber);
    if (draftIndex < 0) {
      return res.status(404).json({ error: "Draft not found for this channel and variation" });
    }

    const candidateDraft = inputDraft;
    const nextDraft = normalizeCreationDrafts([candidateDraft])[0] ?? drafts[draftIndex];
    if (!nextDraft.carousel) {
      return res.status(400).json({ error: "This draft does not include a carousel spec." });
    }

    if (nextDraft.channelId !== channelId) {
      return res.status(400).json({ error: "Draft channel does not match the requested route." });
    }

    const [currentUser] = await db
      .select({ carouselTokens: user.carouselTokens })
      .from(user)
      .where(eq(user.id, req.user.id))
      .limit(1);

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (typeof currentUser.carouselTokens === "number" && currentUser.carouselTokens <= 0) {
      return res.status(403).json({
        error: "Insufficient carousel credits",
        message: "You have used all your monthly carousel render credits. Please upgrade your plan or wait for renewal."
      });
    }

    const renderer = createCarouselRenderProvider();

    let renderedDraft = nextDraft;
    try {
      renderedDraft = await renderCreationDraftCarousel(nextDraft, renderer);
    } catch (renderError: unknown) {
      const message = renderError instanceof Error ? renderError.message : "Failed to render carousel visuals";
      renderedDraft = markCarouselRenderFailure(nextDraft, message);
      drafts[draftIndex] = renderedDraft;

      await db
        .update(creationSessions)
        .set({
          drafts,
          updatedAt: new Date(),
        })
        .where(eq(creationSessions.id, session.id));

      return res.status(500).json({ error: message, draft: renderedDraft });
    }

    drafts[draftIndex] = renderedDraft;
    await db
      .update(creationSessions)
      .set({
        drafts,
        updatedAt: new Date(),
      })
      .where(eq(creationSessions.id, session.id));

    // Success: Decrement 1 carousel token
    await db
      .update(user)
      .set({
        carouselTokens: sql`${user.carouselTokens} - 1`,
      })
      .where(eq(user.id, req.user.id));

    return res.json({ success: true, draft: renderedDraft });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to render carousel";
    return res.status(500).json({ error: message });
  }
});

export default router;
