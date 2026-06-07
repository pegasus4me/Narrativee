import type { CreationWorkflowInput, CreationWorkflowResult, CreationDraft, StrategyPlan, OrchestrationMetadata } from "./types";
import {
  type CarouselTargetPlatform,
  CreatorWorkflowOrchestrator,
  SimpleTaskClassifier,
  SimpleWorkflowPlanner,
  ContentStrategyAgent,
  ContentRepurposingAgent,
  PublishingSchedulingAgent,
  PineconeRagRetriever,
  PineconeMemoryStore,
  ConsoleLogger,
  XAdapter,
  LinkedInAdapter,
  TikTokAdapter,
  InstagramAdapter,
  YouTubeAdapter,
  NewsletterAdapter,
  type PlatformName
} from "creator-agent-orchestrator";
import { buildDraftCarouselFromAsset } from "./creation-drafts";
import { GrokLLMProvider } from "./providers/GrokLLMProvider";

/**
 * Agentic creation engine for Narrativee.
 * Strategy -> repurposing -> publishing validation using creator-agent-orchestrator.
 */
export async function runCreationWorkflow(input: CreationWorkflowInput): Promise<CreationWorkflowResult> {
  const logger = new ConsoleLogger("info");
  const llmProvider = new GrokLLMProvider();

  // Instantiate Pinecone stores using environment variables
  const ragRetriever = new PineconeRagRetriever({
    apiKey: process.env.PINECONE_RAG_API_KEY || "",
    indexName: process.env.PINECONE_RAG_INDEX_NAME || "",
    host: process.env.PINECONE_RAG_HOST,
    namespace: process.env.PINECONE_RAG_NAMESPACE,
    textField: process.env.PINECONE_RAG_TEXT_FIELD || "chunk_text",
  });

  const memoryStore = new PineconeMemoryStore({
    apiKey: process.env.PINECONE_MEMORY_API_KEY || "",
    indexName: process.env.PINECONE_MEMORY_INDEX_NAME || "",
    host: process.env.PINECONE_MEMORY_HOST,
    namespace: process.env.PINECONE_MEMORY_NAMESPACE,
    textField: process.env.PINECONE_MEMORY_TEXT_FIELD || "chunk_text",
    createIndexIfMissing: false,
  });

  const adapters = [
    new XAdapter(),
    new LinkedInAdapter(),
    new TikTokAdapter(),
    new InstagramAdapter(),
    new YouTubeAdapter(),
    new NewsletterAdapter(),
  ];

  const agents = [
    new ContentStrategyAgent(ragRetriever, memoryStore, llmProvider, logger),
    new ContentRepurposingAgent(ragRetriever, memoryStore, llmProvider, logger),
    new PublishingSchedulingAgent(ragRetriever, memoryStore, llmProvider, logger, adapters),
  ];

  const orchestrator = new CreatorWorkflowOrchestrator(
    {
      agents,
      taskClassifier: new SimpleTaskClassifier(),
      workflowPlanner: new SimpleWorkflowPlanner(),
    },
    logger
  );

  const preferredPlatforms = input.channels.map(
    (c) => c.platform.toLowerCase() as PlatformName
  );

  const requestedOutputs: Record<string, unknown> = {
    draftCount: input.draftCount,
  };
  for (const platform of preferredPlatforms) {
    requestedOutputs[`${platform}Posts`] = input.draftCount;
  }
  if (input.carouselPlatforms?.length) {
    requestedOutputs.carouselPlatforms = input.carouselPlatforms;
  }

  let prompt = `Turn this article "${input.articleTitle}" into ${input.draftCount} posts for each of the selected channels. Preferred angles: ${input.selectedAngles.join(", ")}.`;
  if (input.userGoals) {
    prompt += ` User strategy/goals: ${input.userGoals}`;
  }
  if (input.carouselPlatforms?.length) {
    prompt += ` Also generate structured carousel specs for ${formatCarouselPlatforms(input.carouselPlatforms)}.`;
  }

  const response = await orchestrator.handle({
    id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId: input.userId,
    creatorId: input.creatorId || input.userId || "default_creator",
    prompt,
    sourceContent: input.articleContent,
    preferredPlatforms,
    requestedOutputs: requestedOutputs as any,
  });

  // Extract strategy outputs
  const strategyResponse = response.agentResponses.find(
    (r) => r.agentName === "content_strategy_agent"
  );
  const strategyOutput = strategyResponse?.output as any;

  const strategyPlan: StrategyPlan = {
    summary:
      strategyOutput?.positioning ||
      strategyOutput?.voiceGuidance ||
      "Generated content strategy.",
    selectedAngles: strategyOutput?.contentAngles
      ? [...strategyOutput.contentAngles]
      : input.selectedAngles,
    platformDirection: input.channels.reduce<Record<string, string>>((acc, channel) => {
      const pDir = strategyOutput?.platformDirection?.[channel.platform.toLowerCase()];
      acc[channel.platform] = typeof pDir === "string" ? pDir : "Clear, platform-native formatting.";
      return acc;
    }, {}),
  };

  // Extract drafts mapping back to input channels
  const drafts: CreationDraft[] = [];

  for (const asset of response.generatedContentAssets) {
    const matchedChannel = input.channels.find(
      (c) => c.platform.toLowerCase() === asset.platform.toLowerCase()
    );
    if (!matchedChannel) continue;

    const formattingResult = response.platformFormattingResults.find(
      (f) => f.assetId === asset.id
    );
    const text = formattingResult?.formattedText || asset.body;

    let variantNumber = 1;
    if (asset.metadata && typeof asset.metadata.sequence === "number") {
      variantNumber = asset.metadata.sequence;
    } else {
      const parts = asset.id.split("_");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) variantNumber = num;
    }

    drafts.push({
      channelId: matchedChannel.id,
      platform: matchedChannel.platform,
      accountName: matchedChannel.accountName,
      variantNumber,
      angle: asset.title || input.articleTitle,
      text,
      carousel: buildDraftCarouselFromAsset(asset),
    });
  }

  // Build orchestration provenance metadata
  const metadata: OrchestrationMetadata = {
    agentsUsed: [...response.agentsUsed],
    workflowSteps: response.selectedWorkflow.steps.map((step) => ({
      id: step.id,
      taskType: step.taskType,
      description: step.taskType,
    })),
    ragContextUsed: response.ragContextUsed.map((ctx) => ({
      content: typeof ctx.document.content === "string" ? ctx.document.content.slice(0, 500) : "",
      source: typeof ctx.document.metadata?.source === "string" ? ctx.document.metadata.source : (ctx.document.title || "pinecone"),
      score: typeof ctx.score === "number" ? ctx.score : 0,
    })),
    memoriesUsed: response.memoriesUsed.map((mem) => ({
      content: typeof mem.memory.value === "string" ? mem.memory.value.slice(0, 500) : "",
      type: typeof mem.memory.type === "string" ? mem.memory.type : "creator_voice",
    })),
    validationResults: response.validationResults.map((v) => ({
      platform: typeof v.platform === "string" ? v.platform : "unknown",
      isValid: typeof v.valid === "boolean" ? v.valid : true,
      warnings: Array.isArray(v.warnings) ? v.warnings.filter((w): w is string => typeof w === "string") : [],
    })),
    strategy: strategyPlan,
    warnings: [...response.warnings],
  };

  return {
    strategy: strategyPlan,
    drafts,
    metadata,
    warnings: [...response.warnings],
  };
}

const formatCarouselPlatforms = (platforms: readonly CarouselTargetPlatform[]): string =>
  platforms.map((platform) => platform.charAt(0).toUpperCase() + platform.slice(1)).join(" and ");
