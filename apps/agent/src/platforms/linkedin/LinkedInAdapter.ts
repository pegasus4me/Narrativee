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

export class LinkedInAdapter implements SocialPlatformAdapter {
  readonly platform = "linkedin" as const;

  getConstraints(): PlatformConstraints {
    return {
      platform: this.platform,
      maxCharacters: 3000,
      maxHashtags: 5,
      supportsThreads: false,
      supportsVideo: true,
      requiredMetadata: [],
      notes: ["Professional posts benefit from clear spacing.", "Use a low-friction professional CTA."]
    };
  }

  async validateContent(input: PlatformContentInput): Promise<PlatformValidationResult> {
    return validateLength(this.platform, input.asset.body, this.getConstraints().maxCharacters);
  }

  async formatContent(input: PlatformContentInput): Promise<PlatformFormattingResult> {
    const formattedText = compactLines([
      input.asset.title ?? "A practical creator workflow lesson",
      input.asset.body,
      "What would you turn this into first?"
    ]);
    const format = input.asset.kind === "carousel_outline" ? "carousel" : "professional_post";
    return createFormattingResult(
      this.platform,
      input.asset.id,
      formattedText,
      ["#CreatorEconomy", "#AIWorkflow"],
      "What would you turn this into first?",
      { format }
    );
  }

  async prepareSchedulingPayload(input: SchedulingPayloadInput): Promise<SchedulingPayload> {
    return createPayload(input, { destination: "linkedin-dry-run" });
  }
}
