import { Router, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../auth/auth";
import { articles, contentSources, knowledgeBase } from "../auth/schema/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";
import { extractVoiceMemoryProfile } from "../services/memory-service";

const router = Router();

interface VoiceMemoryRecord {
  sources?: unknown[];
  profile?: Record<string, unknown>;
  strictness?: number;
  status?: string;
  lastLearnedAt?: string | null;
  lastLearnedSourceId?: string | null;
}

function normalizeVoiceMemory(rawVoiceMemory: unknown): Required<VoiceMemoryRecord> {
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

  const voiceMemory = rawVoiceMemory as VoiceMemoryRecord;
  return {
    sources: Array.isArray(voiceMemory.sources) ? voiceMemory.sources : [],
    profile: typeof voiceMemory.profile === "object" && voiceMemory.profile !== null ? voiceMemory.profile : {},
    strictness: typeof voiceMemory.strictness === "number" ? voiceMemory.strictness : 50,
    status: typeof voiceMemory.status === "string" ? voiceMemory.status : "idle",
    lastLearnedAt: typeof voiceMemory.lastLearnedAt === "string" ? voiceMemory.lastLearnedAt : null,
    lastLearnedSourceId:
      typeof voiceMemory.lastLearnedSourceId === "string" ? voiceMemory.lastLearnedSourceId : null,
  };
}

async function runMemoryLearningJob(userId: string, sourceId: string): Promise<void> {
  const [source] = await db
    .select()
    .from(contentSources)
    .where(and(eq(contentSources.userId, userId), eq(contentSources.id, sourceId)))
    .limit(1);

  if (!source) {
    throw new Error("Selected source not found");
  }

  const sourceArticles = await db
    .select()
    .from(articles)
    .where(and(eq(articles.userId, userId), eq(articles.sourceId, sourceId)))
    .orderBy(desc(articles.publishedAt))
    .limit(6);

  const [currentKnowledgeBase] = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, userId))
    .limit(1);

  if (!currentKnowledgeBase) {
    throw new Error("Knowledge base not found");
  }

  const extracted = await extractVoiceMemoryProfile(
    source,
    sourceArticles,
    currentKnowledgeBase.voiceMemory,
  );

  const normalizedVoiceMemory = normalizeVoiceMemory(currentKnowledgeBase.voiceMemory);
  const learnedAt = new Date().toISOString();

  await db
    .update(knowledgeBase)
    .set({
      brandVoiceTraining: extracted.brandVoiceTraining,
      voiceMemory: {
        ...normalizedVoiceMemory,
        profile: extracted.profile,
        status: "ready",
        lastLearnedAt: learnedAt,
        lastLearnedSourceId: sourceId,
      },
      updatedAt: new Date(),
    })
    .where(eq(knowledgeBase.userId, userId));
}

/**
 * Starts a background memory learning job for a selected newsletter source.
 */
router.post("/learn", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const sourceId = typeof req.body?.sourceId === "string" ? req.body.sourceId : "";
    if (!sourceId) {
      return res.status(400).json({ error: "sourceId is required" });
    }

    const [existingKnowledgeBase] = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.userId, userId))
      .limit(1);

    if (!existingKnowledgeBase) {
      await db.insert(knowledgeBase).values({
        userId,
        customHooks: [],
        customTemplates: [],
        bannedWords: [],
        brandVoiceTraining: "",
        voiceMemory: {
          sources: [],
          profile: {},
          strictness: 50,
          status: "learning",
          lastLearnedAt: null,
          lastLearnedSourceId: sourceId,
        },
      });
    } else {
      const normalizedVoiceMemory = normalizeVoiceMemory(existingKnowledgeBase.voiceMemory);
      await db
        .update(knowledgeBase)
        .set({
          voiceMemory: {
            ...normalizedVoiceMemory,
            status: "learning",
            lastLearnedSourceId: sourceId,
          },
          updatedAt: new Date(),
        })
        .where(eq(knowledgeBase.userId, userId));
    }

    void runMemoryLearningJob(userId, sourceId).catch(async (error) => {
      console.error("[Memory] Learning job failed:", error);
      const [failedKnowledgeBase] = await db
        .select()
        .from(knowledgeBase)
        .where(eq(knowledgeBase.userId, userId))
        .limit(1);

      if (!failedKnowledgeBase) {
        return;
      }

      const normalizedVoiceMemory = normalizeVoiceMemory(failedKnowledgeBase.voiceMemory);
      await db
        .update(knowledgeBase)
        .set({
          voiceMemory: {
            ...normalizedVoiceMemory,
            status: "failed",
          },
          updatedAt: new Date(),
        })
        .where(eq(knowledgeBase.userId, userId));
    });

    return res.status(202).json({ success: true, status: "learning" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start memory learning";
    return res.status(500).json({ error: message });
  }
});

export default router;
