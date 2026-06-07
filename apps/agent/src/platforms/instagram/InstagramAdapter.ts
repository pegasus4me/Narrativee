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

export class InstagramAdapter implements SocialPlatformAdapter {
  readonly platform = "instagram" as const;

  getConstraints(): PlatformConstraints {
    return {
      platform: this.platform,
      maxCharacters: 2200,
      maxHashtags: 12,
      supportsThreads: false,
      supportsVideo: true,
      requiredMetadata: ["caption"],
      notes: ["Reels need a clear caption.", "Carousel captions should summarize the takeaway."]
    };
  }

  async validateContent(input: PlatformContentInput): Promise<PlatformValidationResult> {
    return validateLength(this.platform, input.asset.body, this.getConstraints().maxCharacters);
  }

  async formatContent(input: PlatformContentInput): Promise<PlatformFormattingResult> {
    const formattedText = compactLines([input.asset.body, "Save this before your next recording."]);
    const format = input.asset.kind === "carousel_outline" ? "carousel" : "reel_or_post";
    return createFormattingResult(
      this.platform,
      input.asset.id,
      formattedText,
      ["#CreatorWorkflow", "#RepurposeContent", "#BuildInPublic"],
      "Save this before your next recording.",
      { format }
    );
  }

  async prepareSchedulingPayload(input: SchedulingPayloadInput): Promise<SchedulingPayload> {
    return createPayload(input, { destination: "instagram-dry-run" });
  }
}
