import { ContentRepurposingAgent } from "../agents/content-repurposing/ContentRepurposingAgent.js";
import { ContentStrategyAgent } from "../agents/content-strategy/ContentStrategyAgent.js";
import { PublishingSchedulingAgent } from "../agents/publishing-scheduling/PublishingSchedulingAgent.js";
import { CreatorWorkflowOrchestrator } from "../orchestrator/Orchestrator.js";
import { SimpleTaskClassifier } from "../orchestrator/TaskClassifier.js";
import { SimpleWorkflowPlanner } from "../orchestrator/WorkflowPlanner.js";
import { loadDotEnv, loadEnv } from "../config/env.js";
import { MockLLMProvider } from "../llm/MockLLMProvider.js";
import { ConsoleLogger } from "../logging/ConsoleLogger.js";
import { PineconeMemoryStore } from "../memory/PineconeMemoryStore.js";
import { defaultRagDocuments } from "../rag/MockRagRetriever.js";
import { PineconeRagRetriever } from "../rag/PineconeRagRetriever.js";
import { InstagramAdapter } from "../platforms/instagram/InstagramAdapter.js";
import { LinkedInAdapter } from "../platforms/linkedin/LinkedInAdapter.js";
import { NewsletterAdapter } from "../platforms/newsletter/NewsletterAdapter.js";
import { TikTokAdapter } from "../platforms/tiktok/TikTokAdapter.js";
import { XAdapter } from "../platforms/x/XAdapter.js";
import { YouTubeAdapter } from "../platforms/youtube/YouTubeAdapter.js";

loadDotEnv();
const env = loadEnv();

const missingEnvVars = [
  ["PINECONE_MEMORY_API_KEY", env.pineconeMemoryApiKey],
  ["PINECONE_MEMORY_INDEX_NAME", env.pineconeMemoryIndexName],
  ["PINECONE_RAG_API_KEY", env.pineconeRagApiKey],
  ["PINECONE_RAG_INDEX_NAME", env.pineconeRagIndexName]
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Set Pinecone memory and RAG env vars before running the example. Missing: ${missingEnvVars.join(", ")}.`
  );
}

const pineconeRagApiKey = env.pineconeRagApiKey!;
const pineconeRagIndexName = env.pineconeRagIndexName!;
const pineconeMemoryApiKey = env.pineconeMemoryApiKey!;
const pineconeMemoryIndexName = env.pineconeMemoryIndexName!;

const logger = new ConsoleLogger("info");
const ragRetriever = new PineconeRagRetriever({
  apiKey: pineconeRagApiKey,
  indexName: pineconeRagIndexName,
  host: env.pineconeRagHost,
  namespace: env.pineconeRagNamespace,
  textField: env.pineconeRagTextField,
  rerank: {
    enabled: env.pineconeRagRerank,
    model: env.pineconeRagRerankModel,
    topN: env.pineconeRagRerankTopN
  }
});
const memoryStore = new PineconeMemoryStore({
  apiKey: pineconeMemoryApiKey,
  indexName: pineconeMemoryIndexName,
  host: env.pineconeMemoryHost,
  namespace: env.pineconeMemoryNamespace,
  textField: env.pineconeMemoryTextField,
  createIndexIfMissing: env.pineconeMemoryCreateIndex,
  cloud: env.pineconeMemoryCloud,
  region: env.pineconeMemoryRegion,
  embeddingModel: env.pineconeMemoryEmbeddingModel,
  rerank: {
    enabled: env.pineconeMemoryRerank,
    model: env.pineconeMemoryRerankModel,
    topN: env.pineconeMemoryRerankTopN
  }
});
const llmProvider = new MockLLMProvider();

await Promise.all([seedRagDocuments(ragRetriever), seedCreatorMemory(memoryStore)]);

const adapters = [
  new XAdapter(),
  new LinkedInAdapter(),
  new TikTokAdapter(),
  new InstagramAdapter(),
  new YouTubeAdapter(),
  new NewsletterAdapter()
];

const agents = [
  new ContentStrategyAgent(ragRetriever, memoryStore, llmProvider, logger),
  new ContentRepurposingAgent(ragRetriever, memoryStore, llmProvider, logger),
  new PublishingSchedulingAgent(ragRetriever, memoryStore, llmProvider, logger, adapters)
];

const orchestrator = new CreatorWorkflowOrchestrator(
  {
    agents,
    taskClassifier: new SimpleTaskClassifier(),
    workflowPlanner: new SimpleWorkflowPlanner()
  },
  logger
);

const response = await orchestrator.handle({
  id: "example_request_1",
  userId: "user_123",
  creatorId: "creator_123",
  prompt: "Turn this YouTube transcript into 5 X posts, 2 LinkedIn posts, and a publishing schedule for next week.",
  sourceContent:
    "In this video, I explain how creators can stop treating every channel as a blank page. The better workflow is to start with one long-form source, extract the strongest ideas, map each idea to the right platform, and schedule the resulting assets around audience behavior.",
  preferredPlatforms: ["x", "linkedin"],
  requestedOutputs: {
    xPosts: 5,
    linkedInPosts: 2,
    schedule: true
  }
});

console.log(JSON.stringify(response, null, 2));

async function seedCreatorMemory(memoryStore: PineconeMemoryStore): Promise<void> {
  await Promise.all([
    memoryStore.store({
      id: "memory_voice",
      creatorId: "creator_123",
      userId: "user_123",
      type: "creator_voice",
      value: "Clear, direct, founder-led, practical, and lightly contrarian.",
      tags: ["voice", "strategy", "repurposing"],
      metadata: { source: "example_seed" }
    }),
    memoryStore.store({
      id: "memory_platforms",
      creatorId: "creator_123",
      userId: "user_123",
      type: "preferred_platforms",
      value: "Prioritize X and LinkedIn for thought leadership.",
      tags: ["platforms", "publishing"],
      metadata: { source: "example_seed" }
    }),
    memoryStore.store({
      id: "memory_timezone",
      creatorId: "creator_123",
      userId: "user_123",
      type: "timezone",
      value: "Europe/Paris",
      tags: ["scheduling"],
      metadata: { source: "example_seed" }
    }),
    memoryStore.store({
      id: "memory_cta",
      creatorId: "creator_123",
      userId: "user_123",
      type: "preferred_cta_style",
      value: "Use soft CTAs that invite replies, saves, or newsletter signups without sounding salesy.",
      tags: ["cta", "repurposing"],
      metadata: { source: "example_seed" }
    }),
    memoryStore.store({
      id: "memory_cadence",
      creatorId: "creator_123",
      userId: "user_123",
      type: "posting_frequency",
      value: "Post weekdays, one X post in the morning and one LinkedIn post around lunch.",
      tags: ["scheduling", "cadence"],
      metadata: { source: "example_seed" }
    })
  ]);
}

async function seedRagDocuments(ragRetriever: PineconeRagRetriever): Promise<void> {
  await ragRetriever.upsertDocuments(defaultRagDocuments);
}
