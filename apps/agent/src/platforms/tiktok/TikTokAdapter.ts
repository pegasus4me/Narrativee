import { compactLines, createFormattingResult, createPayload, validateLength } from "../base/adapterUtils.js";
import type { SocialPlatformAdapter } from "../base/SocialPlatformAdapter.js";
import type {
  PlatformConstraints,
  PlatformContentInput,
  PlatformFormattingResult,
  PlatformValidationResult,
  SchedulingPayload,
  SchedulingPayloadInput
} from "../base/types.js";

export class TikTokAdapter implements SocialPlatformAdapter {
  readonly platform = "tiktok" as const;

  getConstraints(): PlatformConstraints {
    return {
      platform: this.platform,
      maxCharacters: 2200,
      maxHashtags: 6,
      supportsThreads: false,
      supportsVideo: true,
      requiredMetadata: ["caption"],
      notes: ["Scripts should include hook, body, visual direction, and CTA."]
    };
  }

  async validateContent(input: PlatformContentInput): Promise<PlatformValidationResult> {
    return validateLength(this.platform, input.asset.body, this.getConstraints().maxCharacters);
  }

  async formatContent(input: PlatformContentInput): Promise<PlatformFormattingResult> {
    const formattedText = compactLines([
      `Hook: ${input.asset.title ?? "Stop wasting long-form content"}`,
      `Body: ${input.asset.body}`,
      "Visual: show the source transcript turning into platform-native cards.",
      "CTA: Follow for creator workflow systems."
    ]);
    return createFormattingResult(
      this.platform,
      input.asset.id,
      formattedText,
      ["#CreatorTips", "#ContentRepurposing", "#AI"],
      "Follow for creator workflow systems.",
      { format: "short_video_script" }
    );
  }

  async prepareSchedulingPayload(input: SchedulingPayloadInput): Promise<SchedulingPayload> {
    return createPayload(input, { destination: "tiktok-dry-run" });
  }
}
