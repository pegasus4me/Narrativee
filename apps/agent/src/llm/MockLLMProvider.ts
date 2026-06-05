import type { JsonObject, JsonValue } from "../common/types.js";
import type { LLMProvider } from "./LLMProvider.js";
import type { LLMGenerateRequest, LLMGenerateResponse } from "./types.js";

export class MockLLMProvider implements LLMProvider {
  constructor(private readonly model = "mock-structured-llm-v1") {}

  async generateStructured<TOutput extends JsonValue, TContext extends JsonObject = JsonObject>(
    request: LLMGenerateRequest<TContext>
  ): Promise<LLMGenerateResponse<TOutput>> {
    const output = this.generateOutput(request) as TOutput;
    return {
      output,
      model: this.model,
      usage: {
        inputTokens: Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4),
        outputTokens: Math.ceil(JSON.stringify(output).length / 4)
      }
    };
  }

  private generateOutput(request: LLMGenerateRequest): JsonValue {
    switch (request.outputHint) {
      case "content_strategy":
        return {
          pillars: ["Build in public", "Practical AI workflows", "Founder lessons", "Product proof"],
          campaignIdeas: ["30-day AI operator series", "Launch teardown week", "Founder workflow audit"],
          positioning: "Practical AI founder helping creators turn long-form ideas into distribution systems.",
          voiceGuidance: "Keep it direct, useful, and founder-led.",
          platformDirection: {
            x: "Use concise lessons, threads, and sharp hooks.",
            linkedin: "Use reflective posts with clear spacing and professional CTAs."
          }
        };
      case "content_repurposing":
        return {
          summary: "Generated platform-native assets from the source content.",
          hooks: [
            "Most creators do not have a content problem. They have a repurposing system problem.",
            "One transcript can become a full week of thoughtful distribution.",
            "The fastest content workflow starts after the recording ends."
          ],
          ctas: ["Reply with 'workflow' if you want the checklist.", "Save this for your next recording."]
        };
      case "publishing_scheduling":
        return {
          cadence: "Publish X in the morning and LinkedIn near lunch across the next work week.",
          rationale: "Matches remembered creator cadence and platform-native audience behavior."
        };
      default:
        return {
          message: "Mock structured response",
          promptPreview: request.userPrompt.slice(0, 120)
        };
    }
  }
}
