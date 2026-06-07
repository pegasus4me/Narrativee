import type {
  CarouselSlideRole,
  CarouselTargetPlatform,
} from "creator-agent-orchestrator";
import type { CarouselRenderSlide } from "../agentic/types";
import type {
  CarouselRenderProvider,
  CarouselRenderRequest,
  CarouselRenderResponse,
  CarouselTemplateMap,
} from "./CarouselRenderProvider";

const PLACID_API_BASE_URL = "https://api.placid.app/api/rest";
const PLACID_POLL_ATTEMPTS = 8;
const PLACID_POLL_DELAY_MS = 1_250;

type PlacidLayerValue = {
  readonly text?: string;
};

type PlacidImageCreateResponse = {
  readonly id?: number | string;
  readonly status?: string;
  readonly image_url?: string | null;
  readonly polling_url?: string | null;
};

type PlacidImagePollingResponse = {
  readonly id?: number | string;
  readonly status?: string;
  readonly image_url?: string | null;
};

/** Placid-backed implementation of the carousel render provider. */
export class PlacidCarouselRenderProvider implements CarouselRenderProvider {
  constructor(
    private readonly apiToken: string,
    private readonly templatesByPlatform: Readonly<Record<CarouselTargetPlatform, CarouselTemplateMap>>,
  ) {}

  async render(request: CarouselRenderRequest): Promise<CarouselRenderResponse> {
    const templates = this.templatesByPlatform[request.platform];
    const renderedSlides: CarouselRenderSlide[] = [];

    for (const slide of request.spec.slides) {
      const templateId = templates[slide.role];
      const image = await this.createImage(templateId, {
        category: { text: slide.headline },
        title: { text: slide.body },
        eyebrow: { text: request.platform === "linkedin" ? "LinkedIn carousel" : "Instagram carousel" },
        headline: { text: slide.headline },
        body: { text: slide.body },
        slide_counter: { text: `${slide.index}/${request.spec.slideCount}` },
        footer: { text: request.spec.baseCaption },
      });

      renderedSlides.push({
        imageUrl: image.imageUrl,
        role: slide.role,
        providerAssetId: image.providerAssetId,
        templateId,
      });
    }

    return {
      provider: "placid",
      renderedAt: new Date().toISOString(),
      slides: renderedSlides,
    };
  }

  private async createImage(
    templateId: string,
    layers: Readonly<Record<string, PlacidLayerValue>>,
  ): Promise<{ imageUrl: string; providerAssetId: string | null }> {
    const response = await fetch(`${PLACID_API_BASE_URL}/${templateId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        create_now: true,
        layers,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Placid image creation failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as PlacidImageCreateResponse;
    if (typeof payload.image_url === "string" && payload.image_url.length > 0) {
      return {
        imageUrl: payload.image_url,
        providerAssetId: stringifyProviderAssetId(payload.id),
      };
    }

    if (typeof payload.polling_url === "string" && payload.polling_url.length > 0) {
      return this.pollForImage(payload.polling_url, payload.id);
    }

    throw new Error("Placid image creation did not return an image URL or polling URL.");
  }

  private async pollForImage(
    pollingUrl: string,
    providerId: number | string | undefined,
  ): Promise<{ imageUrl: string; providerAssetId: string | null }> {
    for (let attempt = 0; attempt < PLACID_POLL_ATTEMPTS; attempt += 1) {
      await wait(PLACID_POLL_DELAY_MS);

      const response = await fetch(pollingUrl, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Placid polling failed: ${response.status} ${body}`);
      }

      const payload = (await response.json()) as PlacidImagePollingResponse;
      if (typeof payload.image_url === "string" && payload.image_url.length > 0) {
        return {
          imageUrl: payload.image_url,
          providerAssetId: stringifyProviderAssetId(payload.id ?? providerId),
        };
      }

      if (payload.status === "error") {
        throw new Error("Placid returned an error while rendering carousel visuals.");
      }
    }

    throw new Error("Timed out waiting for Placid to finish rendering carousel visuals.");
  }
}

/** Builds the platform + role template mapping from environment variables. */
export function createPlacidTemplateMap(env: NodeJS.ProcessEnv): Readonly<Record<CarouselTargetPlatform, CarouselTemplateMap>> {
  return {
    instagram: {
      hook: requireTemplateId(env.PLACID_INSTAGRAM_CAROUSEL_HOOK_TEMPLATE_ID, "PLACID_INSTAGRAM_CAROUSEL_HOOK_TEMPLATE_ID"),
      insight: requireTemplateId(env.PLACID_INSTAGRAM_CAROUSEL_INSIGHT_TEMPLATE_ID, "PLACID_INSTAGRAM_CAROUSEL_INSIGHT_TEMPLATE_ID"),
      proof: requireTemplateId(env.PLACID_INSTAGRAM_CAROUSEL_PROOF_TEMPLATE_ID, "PLACID_INSTAGRAM_CAROUSEL_PROOF_TEMPLATE_ID"),
      cta: requireTemplateId(env.PLACID_INSTAGRAM_CAROUSEL_CTA_TEMPLATE_ID, "PLACID_INSTAGRAM_CAROUSEL_CTA_TEMPLATE_ID"),
    },
    linkedin: {
      hook: requireTemplateId(env.PLACID_LINKEDIN_CAROUSEL_HOOK_TEMPLATE_ID, "PLACID_LINKEDIN_CAROUSEL_HOOK_TEMPLATE_ID"),
      insight: requireTemplateId(env.PLACID_LINKEDIN_CAROUSEL_INSIGHT_TEMPLATE_ID, "PLACID_LINKEDIN_CAROUSEL_INSIGHT_TEMPLATE_ID"),
      proof: requireTemplateId(env.PLACID_LINKEDIN_CAROUSEL_PROOF_TEMPLATE_ID, "PLACID_LINKEDIN_CAROUSEL_PROOF_TEMPLATE_ID"),
      cta: requireTemplateId(env.PLACID_LINKEDIN_CAROUSEL_CTA_TEMPLATE_ID, "PLACID_LINKEDIN_CAROUSEL_CTA_TEMPLATE_ID"),
    },
  };
}

const requireTemplateId = (value: string | undefined, envName: string): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing Placid template configuration: ${envName}`);
  }

  return value.trim();
};

const stringifyProviderAssetId = (value: number | string | undefined): string | null => {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
};

const wait = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};
