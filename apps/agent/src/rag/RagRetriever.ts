import type { RagQuery, RagResult } from "./types.js";

export interface RagRetriever {
  retrieve(query: RagQuery): Promise<readonly RagResult[]>;
}
