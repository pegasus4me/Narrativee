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

export class XAdapter implements SocialPlatformAdapter {
  readonly platform = "x" as const;

  getConstraints(): PlatformConstraints {
    return {
      platform: this.platform,
      maxCharacters: 280,
      maxHashtags: 3,
      supportsThreads: true,
      supportsVideo: true,
      requiredMetadata: [],
      notes: ["Short posts should lead with a concise hook.", "Threads should keep one idea per post."]
    };
  }

  async validateContent(input: PlatformContentInput): Promise<PlatformValidationResult> {
    return validateLength(this.platform, formatXPost(input.asset.body), this.getConstraints().maxCharacters);
  }

  async formatContent(input: PlatformContentInput): Promise<PlatformFormattingResult> {
    const formattedText = formatXPost(input.asset.body);
    return createFormattingResult(this.platform, input.asset.id, formattedText, ["#AI", "#CreatorWorkflow"], "Reply if you want the workflow.", {
      format: input.asset.kind === "thread" ? "thread" : "post"
    });
  }

  async prepareSchedulingPayload(input: SchedulingPayloadInput): Promise<SchedulingPayload> {
    return createPayload(input, { destination: "x-dry-run" });
  }
}

const xCta = "Reply if you want the workflow.";
const xMaxCharacters = 280;

const formatXPost = (body: string): string => {
  const separator = "\n\n";
  const maxBodyLength = xMaxCharacters - separator.length - xCta.length;
  const trimmedBody = body.length > maxBodyLength ? `${body.slice(0, maxBodyLength - 3)}...` : body;
  return compactLines([trimmedBody, xCta]);
};
