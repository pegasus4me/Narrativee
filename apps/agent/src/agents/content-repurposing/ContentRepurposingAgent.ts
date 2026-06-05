import type { ContentAssetKind, GeneratedContentAsset, JsonValue, PlatformName } from "../../common/types.js";
import { BaseAgent } from "../base/BaseAgent.js";
import type { AgentRequest, AgentResponse, AgentTaskType } from "../base/types.js";
import type { ContentRepurposingOutput } from "./types.js";

type MockRepurposingOutput = {
  readonly summary?: string;
  readonly hooks?: readonly string[];
  readonly ctas?: readonly string[];
  readonly assets?: readonly {
    readonly platform: string;
    readonly body: string;
  }[];
};

export class ContentRepurposingAgent extends BaseAgent<ContentRepurposingOutput & JsonValue> {
  readonly name = "content_repurposing_agent";
  readonly description = "Turns source content into platform-native assets while preserving creator voice.";
  readonly supportedTaskTypes: readonly AgentTaskType[] = ["content_repurposing"];

  protected async executeInternal(request: AgentRequest): Promise<AgentResponse<ContentRepurposingOutput & JsonValue>> {
    const [ragContext, memories] = await Promise.all([
      this.retrieveRag({
        query: `${request.prompt} high-performing content templates formatting rules examples`,
        limit: 6
      }),
      this.retrieveMemory({
        creatorId: request.creatorId,
        userId: request.userId,
        query: `${request.prompt} creator voice hooks CTAs hashtag preferences style`,
        types: ["creator_voice", "hook_style", "preferred_cta_style", "hashtag_preferences", "tone"],
        limit: 8
      })
    ]);

    const llmResponse = await this.llmProvider.generateStructured<MockRepurposingOutput & JsonValue>({
      systemPrompt: `You are a content repurposing agent. Your task is to take the source content and repurpose it into platform-native posts for the requested platforms.
Use the retrieved RAG context (formatting rules, examples) and the creator's voice memory (tone, CTAs, rules) to ensure maximum quality and platform-native fit.
For each platform, generate high-quality post copy in the 'assets' list.

Return structured output with this shape:
{
  "summary": "string",
  "hooks": ["string"],
  "ctas": ["string"],
  "assets": [
    { "platform": "string", "body": "string" }
  ]
}`,
      userPrompt: request.prompt,
      outputHint: "content_repurposing",
      context: {
        sourceContent: request.sourceContent ?? "",
        ragDocumentIds: ragContext.map((result) => result.document.id),
        memoryIds: memories.map((result) => result.memory.id)
      }
    });

    const mock = llmResponse.output as MockRepurposingOutput;
    const assets = createAssets(request, mock, mock.hooks ?? []);
    const output: ContentRepurposingOutput = {
      summary: mock.summary ?? "Generated platform-native assets from source content.",
      assets,
      hooks: mock.hooks ?? [],
      ctas: mock.ctas ?? []
    };

    return {
      agentName: this.name,
      taskType: "content_repurposing",
      output: output as ContentRepurposingOutput & JsonValue,
      ragContext,
      memories,
      generatedAssets: assets,
      warnings: []
    };
  }
}

const createAssets = (
  request: AgentRequest,
  mock: MockRepurposingOutput,
  hooks: readonly string[]
): readonly GeneratedContentAsset[] => {
  const platforms = request.preferredPlatforms?.length ? request.preferredPlatforms : inferPlatforms(request.prompt);
  const requestedCounts = extractCounts(request.prompt);
  const sourceSummary = summarizeSource(request.sourceContent ?? request.prompt);

  return platforms.flatMap((platform) => {
    const count = requestedCounts[platform] ?? 1;
    const platformMockAssets = mock.assets?.filter(
      (a) => a.platform.toLowerCase() === platform.toLowerCase()
    ) || [];

    return Array.from({ length: count }, (_, index) => {
      const kind = kindForPlatform(platform);
      const hook = hooks[index % Math.max(hooks.length, 1)] ?? "One source can become a week of useful content.";
      
      const llmBody = platformMockAssets[index]?.body;
      const body = llmBody || buildBody(platform, hook, sourceSummary, index);

      return {
        id: `${platform}_${index + 1}`,
        platform,
        kind,
        title: platform === "linkedin" ? "A practical creator workflow lesson" : hook,
        body,
        sourceAgent: "content_repurposing_agent",
        metadata: {
          source: "repurposed",
          sequence: index + 1
        }
      };
    });
  });
};

const inferPlatforms = (prompt: string): readonly PlatformName[] => {
  const normalized = prompt.toLowerCase();
  const platforms: PlatformName[] = [];
  if (normalized.includes("x ") || normalized.includes(" x") || normalized.includes("twitter")) platforms.push("x");
  if (normalized.includes("linkedin")) platforms.push("linkedin");
  if (normalized.includes("tiktok")) platforms.push("tiktok");
  if (normalized.includes("instagram")) platforms.push("instagram");
  if (normalized.includes("youtube")) platforms.push("youtube");
  if (normalized.includes("newsletter")) platforms.push("newsletter");
  return platforms.length > 0 ? platforms : ["x", "linkedin"];
};

const extractCounts = (prompt: string): Partial<Record<PlatformName, number>> => {
  const patterns: ReadonlyArray<[PlatformName, RegExp]> = [
    ["x", /(\d+)\s+x\s+posts?/iu],
    ["linkedin", /(\d+)\s+linkedin\s+posts?/iu],
    ["tiktok", /(\d+)\s+tiktok\s+(?:scripts?|posts?)/iu],
    ["instagram", /(\d+)\s+instagram\s+(?:posts?|reels?|scripts?)/iu],
    ["youtube", /(\d+)\s+youtube\s+(?:shorts?|posts?|metadata)/iu],
    ["newsletter", /(\d+)\s+newsletter\s+(?:snippets?|emails?)/iu]
  ];

  return Object.fromEntries(
    patterns
      .map(([platform, pattern]) => [platform, Number(pattern.exec(prompt)?.[1] ?? 0)] as const)
      .filter(([, count]) => count > 0)
  );
};

const kindForPlatform = (platform: PlatformName): ContentAssetKind => {
  const map: Record<PlatformName, ContentAssetKind> = {
    x: "short_post",
    linkedin: "professional_post",
    tiktok: "short_video_script",
    instagram: "reel_script",
    youtube: "shorts_metadata",
    newsletter: "newsletter_snippet"
  };
  return map[platform];
};

const summarizeSource = (source: string): string => source.replace(/\s+/gu, " ").slice(0, 180);

const buildBody = (platform: PlatformName, hook: string, sourceSummary: string, index: number): string => {
  if (platform === "linkedin") {
    return `${hook}\n\nThe useful part is the system: capture one strong idea, identify the audience promise, then adapt the proof and CTA for each channel.\n\nSource note ${index + 1}: ${sourceSummary}`;
  }

  return `${hook}\n\n${sourceSummary}\n\nTurn the idea into a repeatable distribution workflow.`;
};
