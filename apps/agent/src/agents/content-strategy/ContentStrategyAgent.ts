import type { JsonValue } from "../../common/types.js";
import { BaseAgent } from "../base/BaseAgent.js";
import type { AgentRequest, AgentResponse, AgentTaskType } from "../base/types.js";
import type { ContentStrategyOutput } from "./types.js";

export class ContentStrategyAgent extends BaseAgent<ContentStrategyOutput & JsonValue> {
  readonly name = "content_strategy_agent";
  readonly description = "Defines creator content strategy, positioning, pillars, campaigns, and platform direction.";
  readonly supportedTaskTypes: readonly AgentTaskType[] = ["content_strategy"];

  protected async executeInternal(request: AgentRequest): Promise<AgentResponse<ContentStrategyOutput & JsonValue>> {
    const [ragContext, memories] = await Promise.all([
      this.retrieveRag({
        query: `${request.prompt} brand guidelines previous content audience research platform best practices`,
        limit: 5
      }),
      this.retrieveMemory({
        creatorId: request.creatorId,
        userId: request.userId,
        query: `${request.prompt} creator preferences voice target audience niche strategic decisions`,
        types: ["creator_voice", "tone", "niche", "target_audience", "historical_decision"],
        limit: 8
      })
    ]);

    const llmResponse = await this.llmProvider.generateStructured<ContentStrategyOutput & JsonValue>({
      systemPrompt: "You are a content strategy agent for creators. Return structured strategy output.",
      userPrompt: request.prompt,
      outputHint: "content_strategy",
      context: {
        ragDocumentIds: ragContext.map((result) => result.document.id),
        memoryIds: memories.map((result) => result.memory.id)
      }
    });

    const strategy = llmResponse.output as ContentStrategyOutput;
    const output: ContentStrategyOutput = {
      ...strategy,
      contentAngles: [
        "Show the cost of ad hoc content creation.",
        "Teach the repeatable workflow behind distribution.",
        "Use founder proof to make AI practical."
      ]
    };

    return {
      agentName: this.name,
      taskType: "content_strategy",
      output: output as ContentStrategyOutput & JsonValue,
      ragContext,
      memories,
      generatedAssets: [],
      warnings: []
    };
  }
}
