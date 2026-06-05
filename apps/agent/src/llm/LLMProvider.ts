import type { JsonObject, JsonValue } from "../common/types.js";
import type { LLMGenerateRequest, LLMGenerateResponse } from "./types.js";

export interface LLMProvider {
  generateStructured<TOutput extends JsonValue, TContext extends JsonObject = JsonObject>(
    request: LLMGenerateRequest<TContext>
  ): Promise<LLMGenerateResponse<TOutput>>;
}
