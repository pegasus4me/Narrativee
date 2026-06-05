import type { GeneratedContentAsset, JsonObject, JsonValue, PlatformName } from "../../common/types.js";
import type { LLMProvider } from "../../llm/LLMProvider.js";
import type { Logger } from "../../logging/Logger.js";
import type { MemoryRetriever } from "../../memory/MemoryRetriever.js";
import type { MemoryResult } from "../../memory/types.js";
import type { RagRetriever } from "../../rag/RagRetriever.js";
import type { RagResult } from "../../rag/types.js";

export type AgentTaskType = "content_strategy" | "content_repurposing" | "publishing_scheduling";

export type AgentRequest<TInput extends JsonObject = JsonObject> = {
  readonly id: string;
  readonly taskType: AgentTaskType;
  readonly userId?: string;
  readonly creatorId: string;
  readonly prompt: string;
  readonly sourceContent?: string;
  readonly preferredPlatforms?: readonly PlatformName[];
  readonly requestedOutputs?: JsonObject;
  readonly input?: TInput;
  readonly metadata?: JsonObject;
};

export type AgentResponse<TOutput extends JsonValue = JsonValue> = {
  readonly agentName: string;
  readonly taskType: AgentTaskType;
  readonly output: TOutput;
  readonly ragContext: readonly RagResult[];
  readonly memories: readonly MemoryResult[];
  readonly generatedAssets: readonly GeneratedContentAsset[];
  readonly warnings: readonly string[];
};

export type AgentExecutionContext = {
  readonly ragRetriever: RagRetriever;
  readonly memoryRetriever: MemoryRetriever;
  readonly llmProvider: LLMProvider;
  readonly logger: Logger;
};

export interface Agent<TOutput extends JsonValue = JsonValue> extends AgentExecutionContext {
  readonly name: string;
  readonly description: string;
  readonly supportedTaskTypes: readonly AgentTaskType[];
  canHandle(request: AgentRequest): boolean;
  execute(request: AgentRequest): Promise<AgentResponse<TOutput>>;
}
