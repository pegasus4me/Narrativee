import type { MemoryQuery, MemoryResult, StoreMemoryInput, UpdateMemoryInput } from "./types.js";

export interface MemoryRetriever {
  retrieve(query: MemoryQuery): Promise<readonly MemoryResult[]>;
  store(input: StoreMemoryInput): Promise<MemoryResult>;
  update(input: UpdateMemoryInput): Promise<MemoryResult>;
}
