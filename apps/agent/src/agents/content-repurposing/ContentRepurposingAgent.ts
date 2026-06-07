import type {
  CarouselSlideRole,
  CarouselSpec,
  CarouselTargetPlatform,
  ContentAssetKind,
  GeneratedContentAsset,
  JsonObject,
  JsonValue,
  PlatformName
} from "../../common/types.js";
import { BaseAgent } from "../base/BaseAgent.js";
import type { AgentRequest, AgentResponse, AgentTaskType } from "../base/types.js";
import type { ContentRepurposingOutput } from "./types.js";

type MockCarouselSlide = {
  readonly index?: number;
  readonly role?: string;
  readonly headline?: string;
  readonly body?: string;
  readonly visualBrief?: string;
};

type MockCarousel = {
  readonly title?: string;
  readonly baseCaption?: string;
  readonly slideCount?: number;
  readonly slides?: readonly MockCarouselSlide[];
};

type MockRepurposingOutput = {
  readonly summary?: string;
  readonly hooks?: readonly string[];
  readonly ctas?: readonly string[];
  readonly assets?: readonly {
    readonly platform: string;
    readonly body: string;
    readonly carousel?: MockCarousel;
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
    {
      "platform": "string",
      "body": "string",
      "carousel": {
        "title": "string",
        "baseCaption": "string",
        "slideCount": 5,
        "slides": [
          {
            "index": 1,
            "role": "hook | insight | proof | cta",
            "headline": "string",
            "body": "string",
            "visualBrief": "string"
          }
        ]
      }
    }
  ]
}

Only include the "carousel" object for requested Instagram or LinkedIn carousel outputs. Keep carousel slides concise, skimmable, and visually specific.`,
      userPrompt: request.prompt,
      outputHint: "content_repurposing",
      context: {
        sourceContent: request.sourceContent ?? "",
        requestedOutputs: request.requestedOutputs ?? {},
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
  const requestedCarouselPlatforms = extractCarouselPlatforms(request.requestedOutputs);
  const sourceSummary = summarizeSource(request.sourceContent ?? request.prompt);

  return platforms.flatMap((platform) => {
    const count = requestedCounts[platform] ?? 1;
    const platformMockAssets = mock.assets?.filter(
      (a) => a.platform.toLowerCase() === platform.toLowerCase()
    ) || [];

    return Array.from({ length: count }, (_, index) => {
      const shouldGenerateCarousel = isCarouselPlatform(platform) && requestedCarouselPlatforms.includes(platform);
      const kind = shouldGenerateCarousel ? "carousel_outline" : kindForPlatform(platform);
      const hook = hooks[index % Math.max(hooks.length, 1)] ?? "One source can become a week of useful content.";

      const llmBody = platformMockAssets[index]?.body;
      const body = llmBody || buildBody(platform, hook, sourceSummary, index);
      const carousel =
        shouldGenerateCarousel
          ? normalizeCarouselSpec(platformMockAssets[index]?.carousel, platform, hook, sourceSummary, body)
          : undefined;

      return {
        id: `${platform}_${index + 1}`,
        platform,
        kind,
        title: platform === "linkedin" ? "A practical creator workflow lesson" : hook,
        body,
        sourceAgent: "content_repurposing_agent",
        metadata: {
          source: "repurposed",
          sequence: index + 1,
          ...(carousel ? ({ carousel } satisfies JsonObject) : {})
        }
      };
    });
  });
};

const extractCarouselPlatforms = (requestedOutputs?: JsonObject): readonly CarouselTargetPlatform[] => {
  if (!requestedOutputs) {
    return [];
  }

  const explicitPlatforms = requestedOutputs["carouselPlatforms"];
  if (Array.isArray(explicitPlatforms)) {
    return explicitPlatforms.filter(isCarouselTargetPlatform);
  }

  const legacyInstagram = requestedOutputs["instagramCarousel"];
  const legacyLinkedIn = requestedOutputs["linkedinCarousel"];
  const platforms: CarouselTargetPlatform[] = [];

  if (legacyInstagram === true) {
    platforms.push("instagram");
  }

  if (legacyLinkedIn === true) {
    platforms.push("linkedin");
  }

  return platforms;
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

const isCarouselTargetPlatform = (value: JsonValue): value is CarouselTargetPlatform =>
  value === "instagram" || value === "linkedin";

const isCarouselPlatform = (platform: PlatformName): platform is CarouselTargetPlatform =>
  platform === "instagram" || platform === "linkedin";

const normalizeCarouselSpec = (
  candidate: MockCarousel | undefined,
  platform: CarouselTargetPlatform,
  hook: string,
  sourceSummary: string,
  fallbackCaption: string
): CarouselSpec => {
  const fallback = buildFallbackCarouselSpec(platform, hook, sourceSummary, fallbackCaption);
  const candidateSlides = candidate?.slides;

  if (!candidateSlides?.length) {
    return fallback;
  }

  const slides = candidateSlides
    .map((slide, index) => normalizeCarouselSlide(slide, index, fallback))
    .filter((slide): slide is CarouselSpec["slides"][number] => slide !== null);

  if (slides.length === 0) {
    return fallback;
  }

  return {
    title: candidate?.title?.trim() || fallback.title,
    baseCaption: candidate?.baseCaption?.trim() || fallback.baseCaption,
    slideCount: slides.length,
    targetPlatforms: [platform],
    slides
  };
};

const normalizeCarouselSlide = (
  candidate: MockCarouselSlide,
  index: number,
  fallback: CarouselSpec
): CarouselSpec["slides"][number] | null => {
  const fallbackSlide = fallback.slides[index];

  if (!fallbackSlide) {
    return null;
  }

  const role = normalizeSlideRole(candidate.role) ?? fallbackSlide.role;

  return {
    index: typeof candidate.index === "number" && candidate.index > 0 ? candidate.index : fallbackSlide.index,
    role,
    headline: candidate.headline?.trim() || fallbackSlide.headline,
    body: candidate.body?.trim() || fallbackSlide.body,
    visualBrief: candidate.visualBrief?.trim() || fallbackSlide.visualBrief
  };
};

const normalizeSlideRole = (value: string | undefined): CarouselSlideRole | undefined => {
  switch (value) {
    case "hook":
    case "insight":
    case "proof":
    case "cta":
      return value;
    default:
      return undefined;
  }
};

const buildFallbackCarouselSpec = (
  platform: CarouselTargetPlatform,
  hook: string,
  sourceSummary: string,
  fallbackCaption: string
): CarouselSpec => {
  const slides = [
    {
      index: 1,
      role: "hook" as const,
      headline: hook,
      body: "The old workflow breaks because every channel starts from scratch.",
      visualBrief: "Bold cover slide with oversized title and a minimal eyebrow."
    },
    {
      index: 2,
      role: "insight" as const,
      headline: "Start with one source",
      body: "Use the article or transcript as the single source of truth for every downstream asset.",
      visualBrief: "Clean editorial layout with one icon or document metaphor."
    },
    {
      index: 3,
      role: "insight" as const,
      headline: "Pull out the strongest idea",
      body: "Choose the insight that changes how the reader sees the problem, not the most obvious summary.",
      visualBrief: "Two-column contrast slide with one emphasized sentence."
    },
    {
      index: 4,
      role: "proof" as const,
      headline: "What this looks like",
      body: `Example source note: ${sourceSummary}`,
      visualBrief: "Quote or proof card with a highlighted excerpt and subtle supporting decoration."
    },
    {
      index: 5,
      role: "cta" as const,
      headline: platform === "linkedin" ? "What would you build first?" : "Save this workflow",
      body:
        platform === "linkedin"
          ? "Comment if you want this turned into a reusable creator system."
          : "Save this and come back before your next batch recording session.",
      visualBrief: "CTA slide with strong contrast, simple footer, and clear end-of-carousel cue."
    }
  ];

  return {
    title: hook,
    baseCaption: fallbackCaption,
    slideCount: slides.length,
    targetPlatforms: [platform],
    slides
  };
};

const buildBody = (platform: PlatformName, hook: string, sourceSummary: string, index: number): string => {
  if (platform === "linkedin") {
    return `${hook}\n\nThe useful part is the system: capture one strong idea, identify the audience promise, then adapt the proof and CTA for each channel.\n\nSource note ${index + 1}: ${sourceSummary}`;
  }

  return `${hook}\n\n${sourceSummary}\n\nTurn the idea into a repeatable distribution workflow.`;
};
