import { AgentError } from "../../errors/AgentError.js";
import type { LLMProvider } from "../../llm/LLMProvider.js";
import type { Logger } from "../../logging/Logger.js";
import type { MemoryRetriever } from "../../memory/MemoryRetriever.js";
import type { MemoryQuery, MemoryResult } from "../../memory/types.js";
import type { RagRetriever } from "../../rag/RagRetriever.js";
import type { RagQuery, RagResult } from "../../rag/types.js";
import type { Agent, AgentRequest, AgentResponse, AgentTaskType } from "./types.js";
import type { JsonValue } from "../../common/types.js";

export abstract class BaseAgent<TOutput extends JsonValue> implements Agent<TOutput> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly supportedTaskTypes: readonly AgentTaskType[];

  constructor(
    public readonly ragRetriever: RagRetriever,
    public readonly memoryRetriever: MemoryRetriever,
    public readonly llmProvider: LLMProvider,
    public readonly logger: Logger
  ) {}

  canHandle(request: AgentRequest): boolean {
    return this.supportedTaskTypes.includes(request.taskType);
  }

  async execute(request: AgentRequest): Promise<AgentResponse<TOutput>> {
    if (!this.canHandle(request)) {
      throw new AgentError(`${this.name} cannot handle task type ${request.taskType}.`, {
        agent: this.name,
        taskType: request.taskType
      });
    }

    try {
      this.logger.info("Agent execution started", { agent: this.name, requestId: request.id });
      const response = await this.executeInternal(request);
      this.logger.info("Agent execution completed", { agent: this.name, requestId: request.id });
      return response;
    } catch (error) {
      this.logger.error("Agent execution failed", { agent: this.name, requestId: request.id });
      if (error instanceof AgentError) {
        throw error;
      }
      throw new AgentError(`${this.name} failed to execute.`, { agent: this.name, requestId: request.id }, error);
    }
  }

  protected abstract executeInternal(request: AgentRequest): Promise<AgentResponse<TOutput>>;

  protected retrieveRag(query: RagQuery): Promise<readonly RagResult[]> {
    return this.ragRetriever.retrieve(query);
  }

  protected retrieveMemory(query: MemoryQuery): Promise<readonly MemoryResult[]> {
    return this.memoryRetriever.retrieve(query);
  }
}
