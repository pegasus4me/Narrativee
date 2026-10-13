import { z } from "zod";
import { validateCampaignContrast } from "./campaign.contrast";
import type { CampaignDocument, CampaignPlan } from "./campaign.types";
import { campaignRecipes } from "./campaign.direction";
import {
  campaignFormats,
  campaignPlatforms,
  maxCampaignOutputs,
  type CampaignOutput,
} from "./campaign.output";
export { campaignFormats } from "./campaign.output";
export type {
  CampaignDocument,
  CampaignPlan,
  CampaignLayer,
} from "./campaign.types";

export const campaignOutputSchema: z.ZodType<CampaignOutput> = z
  .object({
    platform: z.enum([
      "general",
      "instagram",
      "facebook",
      "linkedin",
      "x",
      "pinterest",
      "tiktok",
    ]),
    formatId: z.enum([
      "square_1080",
      "portrait_1080",
      "vertical_1080",
      "landscape_1200",
      "landscape_1920",
      "pin_1000",
      "custom",
    ]),
    width: z.number().int().min(64).max(4096),
    height: z.number().int().min(64).max(4096),
  })
  .strict()
  .superRefine((output, context) => {
    if (
      Math.max(output.width, output.height) /
        Math.min(output.width, output.height) >
      3
    )
      context.addIssue({
        code: "custom",
        message: "Image outputs support aspect ratios between 1:3 and 3:1",
      });
    if (output.formatId === "custom") return;
    const format = campaignFormats[output.formatId];
    const formats: readonly string[] =
      campaignPlatforms[output.platform].formats;
    if (
      !formats.includes(output.formatId) ||
      output.width !== format.width ||
      output.height !== format.height
    )
      context.addIssue({
        code: "custom",
        message: "Choose a supported platform format with its exact dimensions",
      });
  });
export const campaignOutputsSchema = z
  .array(campaignOutputSchema)
  .min(1)
  .max(maxCampaignOutputs)
  .superRefine((outputs, context) => {
    const keys = outputs.map(
      (output) => `${output.platform}:${output.width}:${output.height}`,
    );
    if (new Set(keys).size !== keys.length)
      context.addIssue({
        code: "custom",
        message: "Choose each platform and size only once",
      });
  });

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const geometry = {
  id: z.string().min(1).max(100),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive().max(4096),
  height: z.number().positive().max(4096),
};
// Zod 4 emits oneOf for discriminated unions; OpenAI needs nested anyOf.
export const campaignLayerSchema = z.union([
  z.object({
    ...geometry,
    type: z.literal("text"),
    text: z.string().min(1).max(300),
    fontFamily: z.string().min(1).max(100),
    fontWeight: z.number().int().min(100).max(900),
    fontSize: z.number().min(12).max(240),
    lineHeight: z.number().min(1).max(1.6),
    align: z.enum(["left", "center", "right"]),
    fill: color,
  }),
  z.object({
    ...geometry,
    type: z.enum(["rect", "ellipse"]),
    fill: color,
    radius: z.number().min(0).max(300),
  }),
  z.object({
    ...geometry,
    type: z.literal("path"),
    d: z.string().min(5).max(4000),
    fill: color,
  }),
  z.object({
    ...geometry,
    type: z.literal("image"),
    assetId: z.string().min(1).max(100),
    fit: z.enum(["contain", "cover"]),
  }),
]);
export const campaignDocumentSchema: z.ZodType<CampaignDocument> = z.object({
  version: z.literal(1),
  frames: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        formatId: z.string().min(1).max(100),
        width: z.number().int().min(64).max(4096),
        height: z.number().int().min(64).max(4096),
        name: z.string().min(1).max(80),
        concept: z.string().min(10).max(600),
        background: color,
        revisionOf: z.string().uuid().optional(),
        version: z.number().int().min(1).max(10000).optional(),
        layers: z.array(campaignLayerSchema).min(1).max(40),
      }),
    )
    .min(1)
    .max(12),
});
const directionSchema = z.object({
  recipeId: z.enum(
    Object.keys(campaignRecipes) as [
      keyof typeof campaignRecipes,
      ...Array<keyof typeof campaignRecipes>,
    ],
  ),
  subject: z.string().min(5).max(400),
  composition: z.string().min(10).max(500),
  lightingAndMaterials: z.string().min(5).max(300),
  typography: z.string().min(5).max(300),
  palette: z.array(z.string().min(1).max(80)).min(1).max(5),
  avoid: z.array(z.string().min(1).max(150)).max(5),
});
const referenceUseSchema = z.object({
  id: z.string().min(1).max(100),
  role: z.enum(["product", "logo", "style", "subject"]),
  instruction: z.string().min(5).max(300),
});
const unusedReferenceSchema = z.object({
  id: z.string().min(1).max(100),
  reason: z.string().min(5).max(250),
});
const creativeDetails = {
  name: z.string().min(1).max(80),
  concept: z.string().min(10).max(600),
  copy: z.array(z.string().min(1).max(300)).max(8),
};
// The provider must supply every field; stored plans also support older approvals.
export const campaignPlanningSchema = z.object({
  renderMode: z.literal("image"),
  clarifyingQuestion: z.string().min(5).max(300).nullable(),
  creatives: z
    .array(
      z.object({
        ...creativeDetails,
        direction: directionSchema,
        references: z.array(referenceUseSchema).max(5),
        unusedReferences: z.array(unusedReferenceSchema).max(12),
      }),
    )
    .min(1)
    .max(12)
    .nullable(),
});
export const campaignPlanSchema: z.ZodType<CampaignPlan> = z.object({
  renderMode: z.literal("image"),
  clarifyingQuestion: z.string().min(5).max(300).nullable(),
  creatives: z
    .array(
      z.object({
        ...creativeDetails,
        imagePrompt: z.string().min(30).max(4000),
        referenceIds: z.array(z.string().min(1).max(100)).max(6),
        direction: directionSchema.optional(),
        references: z.array(referenceUseSchema).max(5).optional(),
        unusedReferences: z.array(unusedReferenceSchema).max(12).optional(),
      }),
    )
    .min(1)
    .max(12)
    .nullable(),
});

export function validateCampaign(
  document: CampaignDocument,
  assetIds: Set<string>,
  fonts: Array<{ family: string; variants: string[] }>,
  options: { contrast?: boolean } = {},
) {
  const ids = new Set<string>();
  for (const frame of document.frames) {
    if (ids.has(frame.id)) throw new Error("Campaign repeats a frame ID");
    ids.add(frame.id);
    const layerIds = new Set<string>();
    for (const layer of frame.layers) {
      if (layerIds.has(layer.id))
        throw new Error("Campaign repeats a layer ID");
      layerIds.add(layer.id);
      if (
        layer.x < 0 ||
        layer.y < 0 ||
        layer.x + layer.width > frame.width + 0.1 ||
        layer.y + layer.height > frame.height + 0.1
      )
        throw new Error("Campaign layer exceeds its frame");
      if (layer.type === "image" && !assetIds.has(layer.assetId))
        throw new Error("Campaign references an unavailable image");
      if (layer.type === "path" && !/^[MmLlHhVvCcQqZz0-9\s,.-]+$/.test(layer.d))
        throw new Error("Campaign path is unsupported");
      if (layer.type === "text") {
        const font = fonts.find((item) => item.family === layer.fontFamily);
        const variant =
          layer.fontWeight === 400 ? "regular" : String(layer.fontWeight);
        if (!font || !font.variants.includes(variant))
          throw new Error(
            `Font ${layer.fontFamily} ${layer.fontWeight} is unavailable. Choose a supported font in Brand Brain.`,
          );
      }
    }
  }
  if (options.contrast !== false) validateCampaignContrast(document);
}
