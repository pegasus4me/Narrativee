import type { LLMProvider, LLMGenerateRequest, LLMGenerateResponse, JsonValue, JsonObject } from "creator-agent-orchestrator";
import { grokJson } from "./grok";

export class GrokLLMProvider implements LLMProvider {
  constructor(private readonly model = "grok-4.3") {}

  async generateStructured<
    TOutput extends JsonValue,
    TContext extends JsonObject = JsonObject
  >(
    request: LLMGenerateRequest<TContext>
  ): Promise<LLMGenerateResponse<TOutput>> {
    const userPayload: Record<string, any> = {
      prompt: request.userPrompt,
    };

    if (request.context) {
      userPayload.context = request.context;
    }
    if (request.outputHint) {
      userPayload.outputHint = request.outputHint;
    }

    const response = await grokJson<JsonObject>({
      systemPrompt: request.systemPrompt,
      userPayload,
      model: this.model,
    });

    if (!response) {
      throw new Error(`Grok LLM generation returned null or failed for hint: ${request.outputHint}`);
    }

    const inputTokens = Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4);
    const outputTokens = Math.ceil(JSON.stringify(response).length / 4);

    return {
      output: response as TOutput,
      model: this.model,
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  }
}
