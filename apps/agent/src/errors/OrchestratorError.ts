import type { JsonObject } from "../common/types.js";
import { AppError } from "./AppError.js";

export class OrchestratorError extends AppError {
  constructor(message: string, metadata: JsonObject = {}, cause?: unknown) {
    super(message, "ORCHESTRATOR_ERROR", metadata, cause);
  }
}
