import type { CarouselSlideRole, CarouselSpec, CarouselTargetPlatform } from "creator-agent-orchestrator";
import type { CarouselRenderSlide } from "../agentic/types";

/** Input payload for rendering one saved carousel into visual slide assets. */
export interface CarouselRenderRequest {
  readonly platform: CarouselTargetPlatform;
  readonly spec: CarouselSpec;
}

/** Render response returned by a visual provider such as Placid. */
export interface CarouselRenderResponse {
  readonly provider: "placid";
  readonly renderedAt: string;
  readonly slides: readonly CarouselRenderSlide[];
}

/** Template selection for the supported carousel slide roles. */
export type CarouselTemplateMap = Readonly<Record<CarouselSlideRole, string>>;

/** Provider interface for rendering carousel slide visuals from a saved spec. */
export interface CarouselRenderProvider {
  render(request: CarouselRenderRequest): Promise<CarouselRenderResponse>;
}
