import type { JsonObject } from "../common/types.js";

export type RagDocument = {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly metadata: JsonObject;
};

export type RagQuery = {
  readonly query: string;
  readonly filters?: JsonObject;
  readonly limit?: number;
};

export type RagResult = {
  readonly document: RagDocument;
  readonly score: number;
};
