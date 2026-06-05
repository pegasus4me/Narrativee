import { compactLines, createFormattingResult, createPayload } from "../base/adapterUtils.js";
import type { SocialPlatformAdapter } from "../base/SocialPlatformAdapter.js";
import type {
  PlatformConstraints,
  PlatformContentInput,
  PlatformFormattingResult,
  PlatformValidationResult,
  SchedulingPayload,
  SchedulingPayloadInput
} from "../base/types.js";

export class NewsletterAdapter implements SocialPlatformAdapter {
  readonly platform = "newsletter" as const;

  getConstraints(): PlatformConstraints {
    return {
      platform: this.platform,
      maxCharacters: 20000,
      maxHashtags: 0,
      supportsThreads: false,
      supportsVideo: false,
      requiredMetadata: ["subject", "previewText"],
      notes: ["Email needs a subject line, preview text, and scannable body."]
    };
  }

  async validateContent(input: PlatformContentInput): Promise<PlatformValidationResult> {
    const valid = input.asset.body.length <= (this.getConstraints().maxCharacters ?? 20000);
    return {
      platform: this.platform,
      valid,
      errors: valid ? [] : ["Newsletter body exceeds configured maximum length."],
      warnings: input.asset.body.length < 120 ? ["Newsletter content may need more depth."] : []
    };
  }

  async formatContent(input: PlatformContentInput): Promise<PlatformFormattingResult> {
    const subject = input.asset.title ?? "A better way to repurpose creator content";
    const previewText = "Turn one strong idea into a platform-native publishing plan.";
    const formattedText = compactLines([`Subject: ${subject}`, `Preview: ${previewText}`, input.asset.body]);
    return createFormattingResult(
      this.platform,
      input.asset.id,
      formattedText,
      [],
      "Forward this to a creator who records more than they publish.",
      { subject, previewText }
    );
  }

  async prepareSchedulingPayload(input: SchedulingPayloadInput): Promise<SchedulingPayload> {
    return createPayload(input, { destination: "newsletter-dry-run" });
  }
}
