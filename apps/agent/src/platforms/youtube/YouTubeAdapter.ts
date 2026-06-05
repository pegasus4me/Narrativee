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

export class YouTubeAdapter implements SocialPlatformAdapter {
  readonly platform = "youtube" as const;

  getConstraints(): PlatformConstraints {
    return {
      platform: this.platform,
      maxCharacters: 5000,
      maxHashtags: 15,
      supportsThreads: false,
      supportsVideo: true,
      requiredMetadata: ["title", "description", "tags"],
      notes: ["Shorts need tight titles.", "Long-form metadata can include chapters when source structure exists."]
    };
  }

  async validateContent(input: PlatformContentInput): Promise<PlatformValidationResult> {
    return validateLength(this.platform, input.asset.body, this.getConstraints().maxCharacters);
  }

  async formatContent(input: PlatformContentInput): Promise<PlatformFormattingResult> {
    const title = input.asset.title ?? "Turn one transcript into a week of content";
    const formattedText = compactLines([title, input.asset.body, "Tags: creator workflow, content repurposing, AI"]);
    return createFormattingResult(
      this.platform,
      input.asset.id,
      formattedText,
      ["#Shorts", "#CreatorWorkflow"],
      "Subscribe for practical creator systems.",
      { title, description: input.asset.body, tags: "creator workflow,content repurposing,AI" }
    );
  }

  async prepareSchedulingPayload(input: SchedulingPayloadInput): Promise<SchedulingPayload> {
    return createPayload(input, { destination: "youtube-dry-run" });
  }
}
