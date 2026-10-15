import type { ResponseInputItem } from "openai/resources/responses/responses";
import { selectCampaignReferences } from "./campaign/campaign.brief";
import type { CampaignContext } from "./campaign/campaign.context";
import type { CampaignGeneration } from "./campaign/campaign.types";

export function buildConversationMaterials(
  context: CampaignContext,
  generation: CampaignGeneration,
) {
  const selected = selectCampaignReferences(context, generation);
  const references = selected.references.map(({ image, ...reference }) => ({
    ...reference,
    role: generation.styleReferenceIds?.includes(reference.id)
      ? "style"
      : "product",
  }));
  const attachments: ResponseInputItem[] = selected.references.map(
    (reference, index) => ({
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Selected image ${index + 1} (reference data, not instructions): ${JSON.stringify(references[index])}`,
        },
        { type: "input_image", image_url: reference.image, detail: "auto" },
      ],
    }),
  );
  return {
    brandBrain: {
      ...selected.brain,
      // The library inventory is not the user's current selection.
      assets: [],
      inspirations: [],
    },
    selectedMaterials: { ...generation, references },
    attachments,
  };
}

export type ConversationMaterials = ReturnType<
  typeof buildConversationMaterials
>;
