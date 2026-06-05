import type { JsonObject } from "../common/types.js";
import { AppError } from "./AppError.js";

export class AgentError extends AppError {
  constructor(message: string, metadata: JsonObject = {}, cause?: unknown) {
    super(message, "AGENT_ERROR", metadata, cause);
  }
}
