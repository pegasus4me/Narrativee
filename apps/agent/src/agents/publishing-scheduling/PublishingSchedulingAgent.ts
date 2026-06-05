import type { GeneratedContentAsset, JsonValue, PlatformName, ScheduleItem } from "../../common/types.js";
import type { LLMProvider } from "../../llm/LLMProvider.js";
import type { Logger } from "../../logging/Logger.js";
import type { MemoryRetriever } from "../../memory/MemoryRetriever.js";
import type { SocialPlatformAdapter } from "../../platforms/base/SocialPlatformAdapter.js";
import type {
  PlatformFormattingResult,
  PlatformValidationResult,
  SchedulingPayload
} from "../../platforms/base/types.js";
import { BaseAgent } from "../base/BaseAgent.js";
import type { AgentRequest, AgentResponse, AgentTaskType } from "../base/types.js";
import type { PublishingPlan } from "./types.js";
import type { RagRetriever } from "../../rag/RagRetriever.js";

export class PublishingSchedulingAgent extends BaseAgent<PublishingPlan & JsonValue> {
  readonly name = "publishing_scheduling_agent";
  readonly description = "Plans publishing cadence, validates platform fit, formats assets, and prepares schedule payloads.";
  readonly supportedTaskTypes: readonly AgentTaskType[] = ["publishing_scheduling"];
  private readonly adaptersByPlatform: ReadonlyMap<PlatformName, SocialPlatformAdapter>;

  constructor(
    ragRetriever: RagRetriever,
    memoryRetriever: MemoryRetriever,
    llmProvider: LLMProvider,
    logger: Logger,
    adapters: readonly SocialPlatformAdapter[]
  ) {
    super(ragRetriever, memoryRetriever, llmProvider, logger);
    this.adaptersByPlatform = new Map(adapters.map((adapter) => [adapter.platform, adapter]));
  }

  protected async executeInternal(request: AgentRequest): Promise<AgentResponse<PublishingPlan & JsonValue>> {
    const assets = getAssets(request);
    const platforms = [...new Set(assets.map((asset) => asset.platform))];

    const [ragContext, memories] = await Promise.all([
      this.retrieveRag({
        query: `${request.prompt} platform constraints content calendar scheduling rules past campaign data`,
        limit: 6
      }),
      this.retrieveMemory({
        creatorId: request.creatorId,
        userId: request.userId,
        query: `${request.prompt} preferred platforms posting frequency timezone publishing decisions`,
        types: ["preferred_platforms", "posting_frequency", "timezone", "past_publishing_preference"],
        limit: 8
      })
    ]);

    const llmResponse = await this.llmProvider.generateStructured<JsonValue>({
      systemPrompt: "You are a publishing and scheduling agent. Return structured cadence guidance.",
      userPrompt: request.prompt,
      outputHint: "publishing_scheduling",
      context: {
        platforms,
        assetIds: assets.map((asset) => asset.id),
        ragDocumentIds: ragContext.map((result) => result.document.id),
        memoryIds: memories.map((result) => result.memory.id)
      }
    });

    const timezone = findMemoryValue(memories, "timezone") ?? "UTC";
    const scheduleDates = createScheduleDates(assets.length, timezone);
    const formattingResults: PlatformFormattingResult[] = [];
    const validationResults: PlatformValidationResult[] = [];
    const schedulingPayloads: SchedulingPayload[] = [];
    const schedule: ScheduleItem[] = [];
    const warnings: string[] = [];

    for (const [index, asset] of assets.entries()) {
      const adapter = this.adaptersByPlatform.get(asset.platform);
      if (!adapter) {
        warnings.push(`No adapter registered for ${asset.platform}.`);
        continue;
      }

      const validation = await adapter.validateContent({ asset, creatorId: request.creatorId, timezone });
      const formatted = await adapter.formatContent({ asset, creatorId: request.creatorId, timezone });
      const payload = await adapter.prepareSchedulingPayload({
        formatted,
        validation,
        scheduledFor: scheduleDates[index] ?? scheduleDates[0],
        creatorId: request.creatorId,
        timezone
      });

      validationResults.push(validation);
      formattingResults.push(formatted);
      schedulingPayloads.push(payload);
      schedule.push({
        assetId: asset.id,
        platform: asset.platform,
        scheduledFor: payload.scheduledFor,
        timezone,
        payloadId: payload.id
      });
      warnings.push(...validation.warnings, ...formatted.warnings);
    }

    const output: PublishingPlan = {
      platforms,
      timezone,
      cadence: extractCadence(llmResponse.output),
      assets,
      formattingResults,
      validationResults,
      schedulingPayloads,
      schedule
    };

    return {
      agentName: this.name,
      taskType: "publishing_scheduling",
      output: output as PublishingPlan & JsonValue,
      ragContext,
      memories,
      generatedAssets: [],
      warnings
    };
  }
}

const getAssets = (request: AgentRequest): readonly GeneratedContentAsset[] => {
  const assets = request.input?.["assets"];
  return Array.isArray(assets) ? (assets as GeneratedContentAsset[]) : [];
};

const findMemoryValue = (
  memories: readonly { readonly memory: { readonly type: string; readonly value: string } }[],
  type: string
): string | undefined => memories.find((result) => result.memory.type === type)?.memory.value;

const createScheduleDates = (count: number, timezone: string): readonly string[] => {
  const base = new Date();
  return Array.from({ length: Math.max(count, 1) }, (_, index) => {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() + index + 1);
    date.setUTCHours(index % 2 === 0 ? 8 : 11, 0, 0, 0);
    return `${date.toISOString()}[${timezone}]`;
  });
};

const extractCadence = (value: JsonValue): string => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as { readonly cadence?: JsonValue };
    if (typeof record.cadence === "string") {
      return record.cadence;
    }
  }

  return "Publish across the next available work week.";
};
