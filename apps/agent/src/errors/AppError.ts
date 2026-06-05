import type { JsonObject } from "../common/types.js";

export class AppError extends Error {
  readonly code: string;
  readonly metadata: JsonObject;
  readonly cause?: unknown;

  constructor(message: string, code: string, metadata: JsonObject = {}, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.metadata = metadata;
    this.cause = cause;
  }
}
