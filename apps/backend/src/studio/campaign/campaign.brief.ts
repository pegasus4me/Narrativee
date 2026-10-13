import { z } from "zod";
import type { CanvasSnapshot } from "../canvas/canvas.schema";
import type { CampaignContext } from "./campaign.context";
import type { CampaignGeneration } from "./campaign.types";

export const campaignGenerationSchema = z
  .object({
    productId: z.string().uuid().optional(),
    referenceIds: z.array(z.string().uuid()).max(5),
    styleReferenceIds: z.array(z.string().uuid()).max(5).optional(),
    editAssetId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((brief, context) => {
    if (
      new Set(brief.referenceIds).size !== brief.referenceIds.length ||
      brief.styleReferenceIds?.some((id) => !brief.referenceIds.includes(id))
    )
      context.addIssue({
        code: "custom",
        message: "Select each reference once with its intended role",
      });
  });

export function selectCampaignReferences(
  context: CampaignContext,
  brief: CampaignGeneration,
) {
  const product = brief.productId
    ? context.brain.products?.find(({ id }) => id === brief.productId)
    : undefined;
  if (brief.productId && !product)
    throw new Error("The selected product is unavailable");
  const references = brief.referenceIds.map((id) => {
    const reference = context.references.find((item) => item.id === id);
    if (!reference)
      throw new Error(
        "A selected reference is unavailable. Attach it again before generating.",
      );
    if (reference.productId && reference.productId !== brief.productId)
      throw new Error("Select photos belonging to the chosen product");
    const style = brief.styleReferenceIds?.includes(id);
    if (style && reference.productId)
      throw new Error("Product photos cannot replace style references");
    return style
      ? { ...reference, kind: "inspiration" as const }
      : {
          ...reference,
          caption: `Selected product reference: ${reference.caption}`,
          ...(brief.productId && reference.kind === "project"
            ? { productId: brief.productId }
            : {}),
        };
  });
  if (product && !references.some(({ productId }) => productId === product.id))
    throw new Error("Choose at least one photo of the selected product");
  return {
    ...context,
    brain: { ...context.brain, products: product ? [product] : [] },
    references,
  };
}

export function readCampaignEdit(
  snapshot: CanvasSnapshot | null,
  assetId: string,
) {
  const objects = snapshot?.canvas.objects;
  const object = Array.isArray(objects)
    ? objects.find(
        (item) =>
          String(item.type).toLowerCase() === "image" &&
          item.data?.assetId === assetId &&
          item.data?.kind === "campaign" &&
          item.data?.role === "artboard" &&
          item.data?.layerId === "creative-image",
      )
    : undefined;
  if (!object)
    throw new Error(
      "Select a generated creative on this project's canvas before requesting changes",
    );
  return z
    .object({
      name: z.string().max(100),
      exportWidth: z.number().int().min(64).max(4096),
      exportHeight: z.number().int().min(64).max(4096),
      version: z.number().int().min(1).max(10000).default(1),
    })
    .parse(object.data);
}
