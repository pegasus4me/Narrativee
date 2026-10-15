import assert from "node:assert/strict";
import test from "node:test";
import { buildConversationMaterials } from "../src/studio/conversation-materials";
import type { CampaignContext } from "../src/studio/campaign/campaign.context";

const context: CampaignContext = {
  brandName: "Soie",
  briefHistory: [],
  teamConversation: [],
  diagnosis: null,
  competitorAnalysis: null,
  fonts: [],
  typographyNotice: null,
  brain: {
    approvedRules: [
      { category: "identity", content: "Keep the logo", source: "user" },
    ],
    websiteObservations: [],
    feedback: [],
    inspirations: [{ category: "imagery", content: "Unselected idea" }],
    assets: [
      {
        kind: "inspiration",
        category: "imagery",
        caption: "Unselected library image",
        filename: "unused.png",
        source: "user",
      },
    ],
    products: [
      {
        id: "product",
        name: "Soie perfume",
        description: "A perfume",
        photoIds: ["photo"],
      },
      {
        id: "other-product",
        name: "Another product",
        description: "Unselected",
        photoIds: [],
      },
    ],
  },
  references: [
    {
      id: "photo",
      productId: "product",
      kind: "rule",
      category: "imagery",
      caption: "Perfume bottle",
      source: "user",
      width: 16,
      height: 16,
      image: "data:image/png;base64,cGhvdG8=",
    },
    {
      id: "style",
      kind: "inspiration",
      category: "imagery",
      caption: "The perspective with the avatar and the object",
      source: "user",
      width: 16,
      height: 16,
      image: "data:image/png;base64,c3R5bGU=",
    },
    {
      id: "other",
      kind: "inspiration",
      category: "imagery",
      caption: "Channel inspiration",
      source: "user",
      width: 16,
      height: 16,
      image: "data:image/png;base64,b3RoZXI=",
    },
  ],
};

test("conversation carries only the selected product and reference pixels with explicit roles", () => {
  const generation = {
    productId: "product",
    referenceIds: ["style", "photo"],
    styleReferenceIds: ["style"],
  };
  const materials = buildConversationMaterials(context, generation);
  assert.deepEqual(materials.selectedMaterials.referenceIds, [
    "style",
    "photo",
  ]);
  assert.deepEqual(
    materials.selectedMaterials.references.map(({ id, role }) => ({
      id,
      role,
    })),
    [
      { id: "style", role: "style" },
      { id: "photo", role: "product" },
    ],
  );
  assert.deepEqual(
    materials.brandBrain.products?.map(({ id }) => id),
    ["product"],
  );
  assert.deepEqual(
    materials.brandBrain.approvedRules,
    context.brain.approvedRules,
  );
  const attachments = materials.attachments.flatMap((item) =>
    "content" in item && Array.isArray(item.content) ? item.content : [],
  );
  assert.deepEqual(
    attachments
      .filter((part) => part.type === "input_image")
      .map((part) => part.image_url),
    [context.references[1]!.image, context.references[0]!.image],
  );
  assert.match(JSON.stringify(attachments), /perspective with the avatar/);
  assert.doesNotMatch(
    JSON.stringify(materials),
    /Channel inspiration|Unselected|Another product|b3RoZXI=/,
  );
  assert.doesNotMatch(JSON.stringify(materials.selectedMaterials), /base64/);
});

test("clearing the composer does not fall back to every saved reference", () => {
  const materials = buildConversationMaterials(context, { referenceIds: [] });
  assert.deepEqual(materials.attachments, []);
  assert.deepEqual(materials.selectedMaterials.references, []);
  assert.deepEqual(materials.brandBrain.products, []);
  assert.deepEqual(materials.brandBrain.assets, []);
  assert.deepEqual(materials.brandBrain.inspirations, []);
});

test("chat rejects missing references and product-role mismatches rather than substituting other images", () => {
  assert.throws(
    () =>
      buildConversationMaterials(context, {
        referenceIds: ["archived-or-foreign"],
      }),
    /selected reference is unavailable/,
  );
  assert.throws(
    () =>
      buildConversationMaterials(context, {
        referenceIds: ["photo"],
        styleReferenceIds: ["photo"],
        productId: "product",
      }),
    /Product photos cannot replace style references/,
  );
  assert.throws(
    () =>
      buildConversationMaterials(context, {
        referenceIds: ["style"],
        productId: "product",
      }),
    /at least one photo/,
  );
});
