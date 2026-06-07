import { getGrokClient } from "../config/xai";
import { runCreationWorkflow } from "../agentic/orchestrator";
import type { CreationDraft, KnowledgeContext, OrchestrationMetadata } from "../agentic/types";
import type { CarouselTargetPlatform } from "creator-agent-orchestrator";

interface ChannelDraftInput {
  id: string;
  platform: string;
  accountName: string | null;
}

/** Draft payload persisted for each generated channel output. */
function buildFallbackDraft(
  angle: string,
  channel: ChannelDraftInput,
  brandVoiceTraining: string,
  variantNumber: number,
): CreationDraft {
  const intro =
    channel.platform === "linkedin"
      ? "Here is a sharp LinkedIn-native take:"
      : channel.platform === "x"
        ? "Short-form version:"
        : `Native ${channel.platform} version:`;

  return {
    channelId: channel.id,
    platform: channel.platform,
    accountName: channel.accountName,
    variantNumber,
    angle,
    text: `${intro}\n\n${angle}\n\n${brandVoiceTraining.slice(0, 220)}`,
  };
}

function buildFallbackDrafts(params: {
  articleTitle: string;
  brandVoiceTraining: string;
  channels: ChannelDraftInput[];
  draftCount: number;
  selectedAngles: string[];
}): CreationDraft[] {
  const { articleTitle, brandVoiceTraining, channels, draftCount, selectedAngles } = params;

  return channels.flatMap((channel, channelIndex) => (
    Array.from({ length: draftCount }, (_unusedValue, draftIndex) => {
      const angleIndex = (channelIndex * draftCount + draftIndex) % selectedAngles.length;
      return buildFallbackDraft(
        selectedAngles[angleIndex] ?? articleTitle,
        channel,
        brandVoiceTraining,
        draftIndex + 1,
      );
    })
  ));
}

function normalizeDraftText(value: unknown, fallbackText: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallbackText;
}

function buildExpectedDrafts(params: {
  articleTitle: string;
  brandVoiceTraining: string;
  channels: ChannelDraftInput[];
  draftCount: number;
  selectedAngles: string[];
  drafts: CreationDraft[];
}): CreationDraft[] {
  const { articleTitle, brandVoiceTraining, channels, draftCount, selectedAngles, drafts } = params;

  return channels.flatMap((channel, channelIndex) => (
    Array.from({ length: draftCount }, (_unusedValue, draftIndex) => {
      const variantNumber = draftIndex + 1;
      const angleIndex = (channelIndex * draftCount + draftIndex) % selectedAngles.length;
      const fallbackDraft = buildFallbackDraft(
        selectedAngles[angleIndex] ?? articleTitle,
        channel,
        brandVoiceTraining,
        variantNumber,
      );
      const matchedDraft = drafts.find((draft) => (
        draft.channelId === channel.id &&
        draft.variantNumber === variantNumber
      ));

      if (!matchedDraft) {
        return fallbackDraft;
      }

      return {
        channelId: channel.id,
        platform: typeof matchedDraft.platform === "string" ? matchedDraft.platform : channel.platform,
        accountName:
          typeof matchedDraft.accountName === "string" || matchedDraft.accountName === null
            ? matchedDraft.accountName
            : channel.accountName,
        variantNumber,
        angle: typeof matchedDraft.angle === "string" ? matchedDraft.angle : fallbackDraft.angle,
        text: normalizeDraftText(matchedDraft.text, fallbackDraft.text),
      };
    })
  ));
}

const PLATFORM_PROMPTS: Record<string, string> = {
  linkedin: `
- Native Tone: Professional yet highly personal, insight-driven, conversational, authority-building, and value-packed.
- Formatting & Hook Rules:
  * Hook: Start with a powerful 1-2 sentence counter-intuitive statement, a question, or a bold opinion. Leave a blank line after the hook to make people click "see more".
  * Spacing: Write in a clean, highly spaced-out layout. Each paragraph should be a maximum of 2 sentences to make it extremely readable on mobile screens.
  * Structure: Use clean unicode emojis (like 💡, 🔑, 👇) or neat bullet points to break down key takeaways.
  * CTA / Outro: End with an engaging open-ended question to drive discussions in the comments, or a definitive, memorable key takeaway.
- Constraints: No corporate buzzwords. Make it feel authentic, creator-driven, and highly engaging.
`,
  x: `
- Native Tone: Extremely punchy, high-impact, direct, high-signal, opinionated, and native to X (Twitter).
- Formatting & Hook Rules:
  * Hook: A single attention-grabbing statement right at the start. Do not say "Here's my take" or "In this newsletter". Start directly with the core message.
  * Structure: Write in 2-3 short, highly-spaced value sentences. Cut all fluff.
  * Length: Must fit comfortably within 280 characters. Keep it brief and memorable.
  * Outro: A punchy ending statement or a direct, engaging question.
- Constraints: Do not use hashtags. Do not use generic intros. Keep emojis to a minimum (0 or 1).
`,
  threads: `
- Native Tone: Raw, highly conversational, relatable, casual, and low-friction.
- Formatting & Hook Rules:
  * Structure: Short, authentic thoughts. Reads like a personal reflection rather than a polished business article.
  * Hook: An intriguing, relatable first-person observation.
  * Outro: A low-barrier question to invite replies and build community.
- Constraints: Relaxed, conversational, and completely unpolished.
`,
  facebook: `
- Native Tone: Narrative-driven, warm, relatable, story-focused, and highly shareable.
- Formatting & Hook Rules:
  * Hook: Empathic, relatable narrative hook.
  * Body: Conversational, friendly storytelling structure with paragraph breaks.
  * Outro: High-engagement conversation starter asking people to share their own experiences.
- Constraints: Friendly and community-centric.
`,
};

/** Result of the creation draft generation, including orchestration provenance. */
interface GenerationResult {
  drafts: CreationDraft[];
  metadata: OrchestrationMetadata | null;
}

/**
 * Generates one draft per selected channel from the chosen angles.
 * Returns both the drafts and the orchestration metadata for UI display.
 */
export async function generateCreationDrafts(params: {
  articleTitle: string;
  articleContent: string;
  sourceArticleSamples?: Array<{ title: string; content: string; url: string | null }>;
  brandVoiceTraining: string;
  selectedAngles: string[];
  channels: ChannelDraftInput[];
  draftCount: number;
  carouselPlatforms?: CarouselTargetPlatform[];
  knowledge?: KnowledgeContext;
  userId?: string;
  creatorId?: string;
  userGoals?: string;
}): Promise<GenerationResult> {
  const { articleTitle, articleContent, sourceArticleSamples, brandVoiceTraining, selectedAngles, channels, draftCount, carouselPlatforms, knowledge, userId, creatorId, userGoals } = params;

  const workflow = await runCreationWorkflow({
    articleTitle,
    articleContent,
    sourceArticleSamples: sourceArticleSamples ?? [],
    selectedAngles,
    channels,
    draftCount,
    carouselPlatforms,
    knowledge: knowledge ?? {
      brandVoiceTraining,
      voiceMemory: {
        sources: [],
        profile: {},
        strictness: 50,
        status: "idle",
        lastLearnedAt: null,
        lastLearnedSourceId: null,
      },
      customHooks: [],
      customTemplates: [],
      bannedWords: [],
    },
    userId,
    creatorId,
    userGoals,
  });

  if (workflow.drafts.length > 0) {
    return { drafts: workflow.drafts, metadata: workflow.metadata };
  }

  console.warn("[Create] Agentic workflow returned no drafts. Falling back to deterministic generation.");
  const fallbackDrafts = buildFallbackDrafts({
    articleTitle,
    brandVoiceTraining,
    channels,
    draftCount,
    selectedAngles,
  });

  return { drafts: fallbackDrafts, metadata: workflow.metadata };
}

export type { CreationDraft };
