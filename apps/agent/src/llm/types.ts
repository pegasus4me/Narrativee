import type { JsonObject, JsonValue } from "../common/types.js";

export type LLMGenerateRequest<TContext extends JsonObject = JsonObject> = {
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly context?: TContext;
  readonly outputHint?: string;
};

export type LLMGenerateResponse<TOutput extends JsonValue> = {
  readonly output: TOutput;
  readonly model: string;
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
};
