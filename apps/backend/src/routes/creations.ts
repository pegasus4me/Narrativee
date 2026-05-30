import { Router, Response } from "express";
import { and, desc, eq, inArray, type InferSelectModel } from "drizzle-orm";
import { db } from "../auth/auth";
import { articles, channels, contentSources, creationSessions, knowledgeBase, socialPosts } from "../auth/schema/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";
import { generateCreationDrafts, type CreationDraft } from "../services/creation-service";

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
  draftCount?: unknown;
}

interface UpdateCreationBody {
  drafts?: unknown;
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

function isCreationDraft(value: unknown): value is CreationDraft {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const draft = value as Record<string, unknown>;
  return (
    typeof draft.channelId === "string" &&
    typeof draft.platform === "string" &&
    (typeof draft.accountName === "string" || draft.accountName === null) &&
    (typeof draft.variantNumber === "number" || typeof draft.variantNumber === "undefined") &&
    typeof draft.angle === "string" &&
    typeof draft.text === "string"
  );
}

function normalizeCreationDrafts(value: unknown): CreationDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isCreationDraft)
    .map((draft, index) => ({
      ...draft,
      variantNumber: typeof draft.variantNumber === "number" ? draft.variantNumber : 1,
    }));
}

/**
 * Creates and persists a saved draft generation session.
 */
router.post("/", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { sourceId, articleId, selectedAngles, selectedChannelIds, draftCount } = req.body as CreateCreationBody;
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
      .where(and(eq(channels.userId, req.user.id), inArray(channels.id, normalizedChannelIds)));

    if (selectedChannels.length !== normalizedChannelIds.length) {
      return res.status(400).json({ error: "One or more selected channels could not be found" });
    }

    const orderedChannels = normalizedChannelIds
      .map((channelId) => selectedChannels.find((channel) => channel.id === channelId))
      .filter((channel): channel is ChannelRecord => Boolean(channel));

    const [currentKnowledgeBase] = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.userId, req.user.id))
      .limit(1);

    const brandVoiceTraining =
      currentKnowledgeBase?.brandVoiceTraining?.trim() ||
      "Write with a clear creator voice that stays native to the selected platform.";

    const drafts = await generateCreationDrafts({
      articleTitle: article.title,
      articleContent: article.content,
      brandVoiceTraining,
      selectedAngles: normalizedAngles,
      channels: orderedChannels.map((channel) => ({
        id: channel.id,
        platform: channel.platform,
        accountName: channel.accountName ?? null,
      })),
      draftCount: normalizedDraftCount,
    });

    const [createdSession] = await db
      .insert(creationSessions)
      .values({
        userId: req.user.id,
        sourceId: source?.id ?? article.sourceId ?? null,
        articleId: article.id,
        selectedAngles: normalizedAngles,
        selectedChannelIds: normalizedChannelIds,
        drafts,
        status: "ready",
      })
      .returning({ id: creationSessions.id });

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
    const selectedChannels = selectedChannelIds.length > 0
      ? await db
          .select()
          .from(channels)
          .where(and(eq(channels.userId, req.user.id), inArray(channels.id, selectedChannelIds)))
      : [];

    const orderedChannels = selectedChannelIds
      .map((channelId) => selectedChannels.find((channel) => channel.id === channelId))
      .filter((channel): channel is ChannelRecord => Boolean(channel));

    return res.json({
      creation: buildCreationSessionPayload({
        session,
        source,
        article,
        selectedChannels: orderedChannels,
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
    const { scheduledAt, text } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: "scheduledAt is required" });
    }

    const [session] = await db
      .select()
      .from(creationSessions)
      .where(and(eq(creationSessions.userId, req.user.id), eq(creationSessions.id, creationId)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Creation session not found" });
    }

    const draft = normalizeCreationDrafts(session.drafts).find((creationDraft) => creationDraft.channelId === channelId);
    if (!draft) {
      return res.status(404).json({ error: "Draft not found for this channel" });
    }

    const draftText = typeof text === "string" ? text : draft.text;

    const [newPost] = await db
      .insert(socialPosts)
      .values({
        userId: req.user.id,
        articleId: session.articleId,
        channelId: channelId,
        content: { text: draftText },
        status: "scheduled",
        scheduledAt: new Date(scheduledAt),
      })
      .returning();

    return res.status(200).json({ success: true, post: newPost });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to schedule draft";
    return res.status(500).json({ error: message });
  }
});

export default router;
