import type { PlatformName } from "../../common/types.js";

export type ContentStrategyOutput = {
  readonly pillars: readonly string[];
  readonly campaignIdeas: readonly string[];
  readonly positioning: string;
  readonly voiceGuidance: string;
  readonly contentAngles: readonly string[];
  readonly platformDirection: Partial<Record<PlatformName, string>>;
};
