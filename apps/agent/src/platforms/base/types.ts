import type { GeneratedContentAsset, JsonObject, PlatformName } from "../../common/types.js";

export type PlatformConstraints = {
  readonly platform: PlatformName;
  readonly maxCharacters?: number;
  readonly maxHashtags?: number;
  readonly supportsThreads: boolean;
  readonly supportsVideo: boolean;
  readonly requiredMetadata: readonly string[];
  readonly notes: readonly string[];
};

export type PlatformContentInput = {
  readonly asset: GeneratedContentAsset;
  readonly creatorId: string;
  readonly timezone?: string;
  readonly metadata?: JsonObject;
};

export type PlatformValidationResult = {
  readonly platform: PlatformName;
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};

export type PlatformFormattingResult = {
  readonly platform: PlatformName;
  readonly assetId: string;
  readonly formattedText: string;
  readonly caption?: string;
  readonly hashtags: readonly string[];
  readonly cta?: string;
  readonly metadata: JsonObject;
  readonly warnings: readonly string[];
};

export type SchedulingPayloadInput = {
  readonly formatted: PlatformFormattingResult;
  readonly validation: PlatformValidationResult;
  readonly scheduledFor: string;
  readonly creatorId: string;
  readonly timezone: string;
};

export type SchedulingPayload = {
  readonly id: string;
  readonly platform: PlatformName;
  readonly assetId: string;
  readonly scheduledFor: string;
  readonly timezone: string;
  readonly content: string;
  readonly metadata: JsonObject;
  readonly dryRun: true;
};
