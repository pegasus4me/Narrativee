import type { PlatformName } from "../../common/types.js";
import type {
  PlatformFormattingResult,
  PlatformValidationResult,
  SchedulingPayload,
  SchedulingPayloadInput
} from "./types.js";

export const validateLength = (
  platform: PlatformName,
  text: string,
  maxCharacters?: number
): PlatformValidationResult => {
  const errors = maxCharacters && text.length > maxCharacters ? [`Content exceeds ${maxCharacters} characters.`] : [];
  return {
    platform,
    valid: errors.length === 0,
    errors,
    warnings: text.length < 40 ? ["Content may be too short for meaningful context."] : []
  };
};

export const compactLines = (lines: readonly string[]): string => lines.filter(Boolean).join("\n\n");

export const createFormattingResult = (
  platform: PlatformName,
  assetId: string,
  formattedText: string,
  hashtags: readonly string[],
  cta: string,
  metadata: Record<string, string | number | boolean>,
  warnings: readonly string[] = []
): PlatformFormattingResult => ({
  platform,
  assetId,
  formattedText,
  caption: formattedText,
  hashtags,
  cta,
  metadata,
  warnings
});

export const createPayload = (
  input: SchedulingPayloadInput,
  extraMetadata: Record<string, string | number | boolean> = {}
): SchedulingPayload => ({
  id: `schedule_${input.formatted.platform}_${input.formatted.assetId}`,
  platform: input.formatted.platform,
  assetId: input.formatted.assetId,
  scheduledFor: input.scheduledFor,
  timezone: input.timezone,
  content: input.formatted.formattedText,
  metadata: {
    ...input.formatted.metadata,
    ...extraMetadata,
    validationStatus: input.validation.valid ? "valid" : "invalid"
  },
  dryRun: true
});
