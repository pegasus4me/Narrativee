import type { PlatformName } from "../../common/types.js";
import type {
  PlatformConstraints,
  PlatformContentInput,
  PlatformFormattingResult,
  PlatformValidationResult,
  SchedulingPayload,
  SchedulingPayloadInput
} from "./types.js";

export interface SocialPlatformAdapter {
  readonly platform: PlatformName;
  getConstraints(): PlatformConstraints;
  validateContent(input: PlatformContentInput): Promise<PlatformValidationResult>;
  formatContent(input: PlatformContentInput): Promise<PlatformFormattingResult>;
  prepareSchedulingPayload(input: SchedulingPayloadInput): Promise<SchedulingPayload>;
}
