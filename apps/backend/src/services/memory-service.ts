import type { InferSelectModel } from "drizzle-orm";
import { articles, contentSources, knowledgeBase } from "../auth/schema/schema";
import { getGrokClient } from "../config/xai";

type KnowledgeBaseRecord = InferSelectModel<typeof knowledgeBase>;
type ArticleRecord = InferSelectModel<typeof articles>;
type ContentSourceRecord = InferSelectModel<typeof contentSources>;

interface VoiceProfilePayload {
  tone: string;
  vocabulary: string;
  sentenceLength: string;
  humorLevel: string;
  opinionatedVsNeutral: string;
  ctaStyle: string;
  topicsToAvoid: string;
  frequentPhrases: string;
}

interface ExtractedVoiceMemory {
  brandVoiceTraining: string;
  profile: VoiceProfilePayload;
}

function getVoiceSources(rawVoiceMemory: unknown): Array<{ category: string; content: string }> {
  if (typeof rawVoiceMemory !== "object" || rawVoiceMemory === null) {
    return [];
  }

  const voiceMemory = rawVoiceMemory as Record<string, unknown>;
  const rawSources = Array.isArray(voiceMemory.sources) ? voiceMemory.sources : [];

  return rawSources
    .filter((source) => typeof source === "object" && source !== null)
    .map((source) => {
      const sourceRecord = source as Record<string, unknown>;
      return {
        category: typeof sourceRecord.category === "string" ? sourceRecord.category : "newsletter",
        content: typeof sourceRecord.content === "string" ? sourceRecord.content : "",
      };
    })
    .filter((source) => source.content.trim().length > 0);
}

function buildSampleCorpus(
  source: ContentSourceRecord,
  sourceArticles: ArticleRecord[],
  rawVoiceMemory: unknown,
): string {
  const articleSamples = sourceArticles
    .map((article, index) => {
      const title = article.title.trim() || `Issue ${index + 1}`;
      const content = article.content.replace(/\s+/g, " ").trim().slice(0, 2000);
      return `Newsletter issue ${index + 1}: ${title}\n${content}`;
    })
    .filter((sample) => sample.trim().length > 0);

  const manualSamples = getVoiceSources(rawVoiceMemory).map((entry, index) => (
    `Manual ${entry.category} sample ${index + 1}:\n${entry.content.slice(0, 2000)}`
  ));

  return [
    `Primary source: ${source.url ?? "Unknown newsletter source"}`,
    ...articleSamples,
    ...manualSamples,
  ].join("\n\n---\n\n");
}

function buildFallbackVoiceMemory(corpus: string): ExtractedVoiceMemory {
  const compactCorpus = corpus.replace(/\s+/g, " ").trim();
  const excerpt = compactCorpus.slice(0, 260);
  return {
    brandVoiceTraining: excerpt
      ? `Write with the same tone and pacing as these source materials: ${excerpt}`
      : "Write with a clear, creator-first tone that matches the user's prior newsletter samples.",
    profile: {
      tone: "Direct and creator-first",
      vocabulary: "Clear, practical, low-jargon",
      sentenceLength: "Mostly short with occasional medium-length explanation",
      humorLevel: "Light",
      opinionatedVsNeutral: "Balanced with conviction",
      ctaStyle: "One concise next step at the end",
      topicsToAvoid: "Generic hype and vague platitudes",
      frequentPhrases: excerpt.slice(0, 120),
    },
  };
}

/**
 * Extracts a structured voice profile from newsletter and manual memory samples.
 */
export async function extractVoiceMemoryProfile(
  source: ContentSourceRecord,
  sourceArticles: ArticleRecord[],
  rawVoiceMemory: unknown,
): Promise<ExtractedVoiceMemory> {
  const corpus = buildSampleCorpus(source, sourceArticles, rawVoiceMemory);
  const grok = getGrokClient();

  if (!corpus.trim()) {
    return buildFallbackVoiceMemory(corpus);
  }

  if (!grok) {
    console.warn("[Memory] GROK_API_KEY is unavailable. Falling back to deterministic voice extraction.");
    return buildFallbackVoiceMemory(corpus);
  }

  const response = await grok.chat.completions.create({
    model: "grok-4.3",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You extract a writing voice profile from newsletter samples.
Return strict JSON with this shape:
{
  "brandVoiceTraining": "string",
  "profile": {
    "tone": "string",
    "vocabulary": "string",
    "sentenceLength": "string",
    "humorLevel": "string",
    "opinionatedVsNeutral": "string",
    "ctaStyle": "string",
    "topicsToAvoid": "string",
    "frequentPhrases": "string"
  }
}

Rules:
- Be specific and concise.
- Infer patterns from the source samples only.
- "brandVoiceTraining" should be a strong internal instruction paragraph for future generation.
- No markdown.`,
      },
      {
        role: "user",
        content: corpus.slice(0, 18000),
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    return buildFallbackVoiceMemory(corpus);
  }

  const parsed = JSON.parse(rawContent) as Partial<ExtractedVoiceMemory>;
  const fallback = buildFallbackVoiceMemory(corpus);

  return {
    brandVoiceTraining:
      typeof parsed.brandVoiceTraining === "string" && parsed.brandVoiceTraining.trim().length > 0
        ? parsed.brandVoiceTraining.trim()
        : fallback.brandVoiceTraining,
    profile: {
      tone: typeof parsed.profile?.tone === "string" ? parsed.profile.tone : fallback.profile.tone,
      vocabulary:
        typeof parsed.profile?.vocabulary === "string" ? parsed.profile.vocabulary : fallback.profile.vocabulary,
      sentenceLength:
        typeof parsed.profile?.sentenceLength === "string"
          ? parsed.profile.sentenceLength
          : fallback.profile.sentenceLength,
      humorLevel:
        typeof parsed.profile?.humorLevel === "string" ? parsed.profile.humorLevel : fallback.profile.humorLevel,
      opinionatedVsNeutral:
        typeof parsed.profile?.opinionatedVsNeutral === "string"
          ? parsed.profile.opinionatedVsNeutral
          : fallback.profile.opinionatedVsNeutral,
      ctaStyle: typeof parsed.profile?.ctaStyle === "string" ? parsed.profile.ctaStyle : fallback.profile.ctaStyle,
      topicsToAvoid:
        typeof parsed.profile?.topicsToAvoid === "string"
          ? parsed.profile.topicsToAvoid
          : fallback.profile.topicsToAvoid,
      frequentPhrases:
        typeof parsed.profile?.frequentPhrases === "string"
          ? parsed.profile.frequentPhrases
          : fallback.profile.frequentPhrases,
    },
  };
}

export type { KnowledgeBaseRecord, ContentSourceRecord, ArticleRecord, ExtractedVoiceMemory };
