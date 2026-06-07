import type {
  CarouselSlideRole,
  CarouselSpec,
  CarouselTargetPlatform,
  GeneratedContentAsset,
  JsonValue,
} from "creator-agent-orchestrator";
import type { CreationDraft, CreationDraftCarousel } from "./types";

const CAROUSEL_PLATFORMS: readonly CarouselTargetPlatform[] = ["instagram", "linkedin"];

interface ScheduledTextContent {
  readonly text: string;
}

interface ScheduledCarouselSlideContent {
  readonly imageUrl: string;
  readonly role: CarouselSlideRole;
  readonly providerAssetId: string | null;
  readonly templateId: string | null;
}

interface ScheduledCarouselContent {
  readonly text: string;
  readonly type: "carousel";
  readonly slides: readonly ScheduledCarouselSlideContent[];
}

/** Scheduled post content created from a saved creation draft. */
export type ScheduledDraftContent = ScheduledTextContent | ScheduledCarouselContent;

/** Returns whether the given value is a supported carousel platform. */
export function isCarouselTargetPlatform(value: string): value is CarouselTargetPlatform {
  return CAROUSEL_PLATFORMS.includes(value as CarouselTargetPlatform);
}

/** Parses and de-duplicates requested carousel platforms from a request body. */
export function extractCarouselPlatforms(value: unknown): CarouselTargetPlatform[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item): item is CarouselTargetPlatform => typeof item === "string" && isCarouselTargetPlatform(item)))];
}

/** Returns true when the unknown value matches the persisted creation draft contract. */
export function isCreationDraft(value: unknown): value is CreationDraft {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const draft = value as Record<string, unknown>;
  const carouselValue = draft.carousel;

  return (
    typeof draft.channelId === "string" &&
    typeof draft.platform === "string" &&
    (typeof draft.accountName === "string" || draft.accountName === null) &&
    (typeof draft.variantNumber === "number" || typeof draft.variantNumber === "undefined") &&
    typeof draft.angle === "string" &&
    typeof draft.text === "string" &&
    (typeof carouselValue === "undefined" || carouselValue === null || isCreationDraftCarousel(carouselValue))
  );
}

/** Normalizes persisted draft JSON into typed creation drafts. */
export function normalizeCreationDrafts(value: unknown): CreationDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isCreationDraft)
    .map((draft) => ({
      ...draft,
      variantNumber: typeof draft.variantNumber === "number" ? draft.variantNumber : 1,
      carousel: draft.carousel ?? null,
    }));
}

/** Locates a saved draft by channel and variant number. */
export function findCreationDraftIndex(
  drafts: readonly CreationDraft[],
  channelId: string,
  variantNumber: number,
): number {
  return drafts.findIndex((draft) => (
    draft.channelId === channelId &&
    draft.variantNumber === variantNumber
  ));
}

/** Extracts a carousel payload from an orchestrator-generated content asset. */
export function buildDraftCarouselFromAsset(asset: GeneratedContentAsset): CreationDraftCarousel | null {
  if (!isCarouselTargetPlatform(asset.platform)) {
    return null;
  }

  const rawCarousel = asset.metadata["carousel"];
  const spec = isCarouselSpec(rawCarousel) ? rawCarousel : null;
  if (!spec) {
    return null;
  }

  return {
    spec,
    renderStatus: "not_requested",
    render: null,
    errorMessage: null,
  };
}

/** Builds the JSON payload scheduled for publishing from a saved draft. */
export function buildScheduledDraftContent(
  draft: CreationDraft,
  overrideText?: string,
): ScheduledDraftContent {
  const text = typeof overrideText === "string" && overrideText.trim().length > 0
    ? overrideText
    : draft.text;
  const renderedSlides = draft.carousel?.render?.slides ?? [];

  if (!draft.carousel || renderedSlides.length === 0) {
    return { text };
  }

  return {
    text,
    type: "carousel",
    slides: renderedSlides.map((slide) => ({
      imageUrl: slide.imageUrl,
      role: slide.role,
      providerAssetId: slide.providerAssetId,
      templateId: slide.templateId,
    })),
  };
}

const isCreationDraftCarousel = (value: unknown): value is CreationDraftCarousel => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const carousel = value as Record<string, unknown>;
  return (
    isCarouselSpec(carousel.spec) &&
    (carousel.renderStatus === "not_requested" || carousel.renderStatus === "rendered" || carousel.renderStatus === "failed") &&
    (carousel.render === null || typeof carousel.render === "object") &&
    (carousel.errorMessage === null || typeof carousel.errorMessage === "string")
  );
};

const isCarouselSpec = (value: unknown): value is CarouselSpec => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const spec = value as Record<string, JsonValue | undefined>;
  return (
    typeof spec.title === "string" &&
    typeof spec.baseCaption === "string" &&
    typeof spec.slideCount === "number" &&
    Array.isArray(spec.targetPlatforms) &&
    spec.targetPlatforms.every((platform) => typeof platform === "string" && isCarouselTargetPlatform(platform)) &&
    Array.isArray(spec.slides) &&
    spec.slides.every(isCarouselSlideSpec)
  );
};

const isCarouselSlideSpec = (value: JsonValue): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const slide = value as Record<string, JsonValue | undefined>;
  return (
    typeof slide.index === "number" &&
    (slide.role === "hook" || slide.role === "insight" || slide.role === "proof" || slide.role === "cta") &&
    typeof slide.headline === "string" &&
    typeof slide.body === "string" &&
    typeof slide.visualBrief === "string"
  );
};
