import type { JsonObject } from "../common/types.js";

export type MemoryType =
  | "creator_voice"
  | "tone"
  | "niche"
  | "target_audience"
  | "preferred_platforms"
  | "posting_frequency"
  | "timezone"
  | "preferred_cta_style"
  | "hook_style"
  | "hashtag_preferences"
  | "historical_decision"
  | "past_publishing_preference";

export type MemoryRecord = {
  readonly id: string;
  readonly creatorId: string;
  readonly userId?: string;
  readonly type: MemoryType;
  readonly value: string;
  readonly tags: readonly string[];
  readonly metadata: JsonObject;
  readonly updatedAt: string;
};

export type MemoryQuery = {
  readonly creatorId?: string;
  readonly userId?: string;
  readonly query?: string;
  readonly types?: readonly MemoryType[];
  readonly tags?: readonly string[];
  readonly limit?: number;
};

export type MemoryResult = {
  readonly memory: MemoryRecord;
  readonly confidence: number;
};

export type StoreMemoryInput = Omit<MemoryRecord, "id" | "updatedAt"> & {
  readonly id?: string;
};

export type UpdateMemoryInput = Partial<Omit<MemoryRecord, "id" | "creatorId">> & {
  readonly id: string;
};
