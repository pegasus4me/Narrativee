import type {
  CampaignArtDirection,
  CampaignReferenceUse,
} from "./campaign.direction";

// Wire types only: safe for the Studio client to import without server code.
type LayerGeometry = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type CampaignLayer = LayerGeometry &
  (
    | {
        type: "text";
        text: string;
        fontFamily: string;
        fontWeight: number;
        fontSize: number;
        lineHeight: number;
        align: "left" | "center" | "right";
        fill: string;
      }
    | { type: "rect" | "ellipse"; fill: string; radius: number }
    | { type: "path"; d: string; fill: string }
    | { type: "image"; assetId: string; fit: "contain" | "cover" }
  );
export interface CampaignDocument {
  version: 1;
  frames: Array<{
    id: string;
    formatId: string;
    width: number;
    height: number;
    name: string;
    concept: string;
    background: string;
    revisionOf?: string;
    version?: number;
    layers: CampaignLayer[];
  }>;
}
export interface CampaignGeneration {
  productId?: string;
  referenceIds: string[];
  styleReferenceIds?: string[];
  editAssetId?: string;
}
// Retained only to recognize proposals saved before full-image generation.
export interface LegacyCampaignPlan {
  clarifyingQuestion: string | null;
  document: CampaignDocument | null;
  imageBrief: string | null;
}
export interface CampaignCreative {
  name: string;
  concept: string;
  copy: string[];
  imagePrompt: string;
  referenceIds: string[];
  // Older saved image proposals have only imagePrompt/referenceIds.
  direction?: CampaignArtDirection;
  references?: CampaignReferenceUse[];
  unusedReferences?: Array<{ id: string; reason: string }>;
}
export interface CampaignPlan {
  renderMode: "image";
  clarifyingQuestion: string | null;
  creatives: CampaignCreative[] | null;
}
