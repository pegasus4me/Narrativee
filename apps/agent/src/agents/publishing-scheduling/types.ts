import type { GeneratedContentAsset, PlatformName, ScheduleItem } from "../../common/types.js";
import type {
  PlatformFormattingResult,
  PlatformValidationResult,
  SchedulingPayload
} from "../../platforms/base/types.js";

export type PublishingPlan = {
  readonly platforms: readonly PlatformName[];
  readonly timezone: string;
  readonly cadence: string;
  readonly assets: readonly GeneratedContentAsset[];
  readonly formattingResults: readonly PlatformFormattingResult[];
  readonly validationResults: readonly PlatformValidationResult[];
  readonly schedulingPayloads: readonly SchedulingPayload[];
  readonly schedule: readonly ScheduleItem[];
};
