import type { CreationDraft } from "../agentic/types";
import { PlacidCarouselRenderProvider, createPlacidTemplateMap } from "./PlacidCarouselRenderProvider";
import type { CarouselRenderProvider } from "./CarouselRenderProvider";

/** Creates the configured carousel renderer from process environment variables. */
export function createCarouselRenderProvider(env: NodeJS.ProcessEnv = process.env): CarouselRenderProvider {
  const apiToken = env.PLACID_API_TOKEN?.trim();
  if (!apiToken) {
    throw new Error("Missing Placid configuration: PLACID_API_TOKEN");
  }

  return new PlacidCarouselRenderProvider(apiToken, createPlacidTemplateMap(env));
}

/** Renders and returns an updated creation draft with fresh carousel visuals. */
export async function renderCreationDraftCarousel(
  draft: CreationDraft,
  renderer: CarouselRenderProvider,
): Promise<CreationDraft> {
  if (!draft.carousel) {
    throw new Error("This draft does not include a carousel spec.");
  }

  const [platform] = draft.carousel.spec.targetPlatforms;
  if (!platform) {
    throw new Error("Carousel spec is missing a target platform.");
  }

  const render = await renderer.render({
    platform,
    spec: draft.carousel.spec,
  });

  return {
    ...draft,
    carousel: {
      ...draft.carousel,
      renderStatus: "rendered",
      render,
      errorMessage: null,
    },
  };
}

/** Returns a failed carousel draft while keeping the editable spec intact. */
export function markCarouselRenderFailure(
  draft: CreationDraft,
  errorMessage: string,
): CreationDraft {
  if (!draft.carousel) {
    return draft;
  }

  return {
    ...draft,
    carousel: {
      ...draft.carousel,
      renderStatus: "failed",
      errorMessage,
    },
  };
}
