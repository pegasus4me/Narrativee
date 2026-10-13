import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { runCampaignRequest } from "../src/studio/campaign/campaign.service";
import {
  campaignGenerationSchema,
  readCampaignEdit,
  selectCampaignReferences,
} from "../src/studio/campaign/campaign.brief";
import { campaignCreditBound } from "../src/studio/campaign/campaign.cost";
import { defaultCampaignOutput } from "../src/studio/campaign/campaign.output";
import type { CampaignContext } from "../src/studio/campaign/campaign.context";
import type { CampaignPlan } from "../src/studio/campaign/campaign.types";
import type { CanvasSnapshot } from "../src/studio/canvas/canvas.schema";
import type { CreatorEvent } from "../src/studio/creator.service";

const productId = randomUUID(),
  photoId = randomUUID(),
  otherPhotoId = randomUUID(),
  styleId = randomUUID(),
  sourceId = randomUUID();
const context: CampaignContext = {
  brandName: "Soie",
  briefHistory: [],
  teamConversation: [],
  diagnosis: null,
  competitorAnalysis: null,
  brain: {
    approvedRules: [],
    websiteObservations: [],
    inspirations: [],
    feedback: [],
    assets: [],
    products: [
      {
        id: productId,
        name: "Soie",
        description: "A solar perfume",
        photoIds: [photoId],
      },
    ],
  },
  fonts: [],
  typographyNotice: null,
  references: [
    {
      id: photoId,
      productId,
      kind: "rule",
      category: "imagery",
      caption: "Bottle",
      source: "user",
      width: 16,
      height: 16,
      image: "data:image/png;base64,cGl4ZWxz",
    },
    {
      id: otherPhotoId,
      productId: randomUUID(),
      kind: "rule",
      category: "imagery",
      caption: "Other product",
      source: "user",
      width: 16,
      height: 16,
      image: "data:image/png;base64,cGl4ZWxz",
    },
    {
      id: styleId,
      kind: "project",
      category: "reference",
      caption: "A visual inspiration",
      source: "studio-upload",
      width: 16,
      height: 16,
      image: "data:image/png;base64,cGl4ZWxz",
    },
  ],
};
const snapshot: CanvasSnapshot = {
  version: 1,
  favorites: [],
  viewport: [1, 0, 0, 1, 0, 0],
  canvas: {
    objects: [
      {
        type: "Image",
        data: {
          assetId: sourceId,
          kind: "campaign",
          role: "artboard",
          layerId: "creative-image",
          name: "Soie editorial",
          exportWidth: 1080,
          exportHeight: 1350,
          version: 2,
        },
      },
    ],
  },
};

test("explicit references cannot mix products, invent IDs or use a product as style", () => {
  const selected = selectCampaignReferences(context, {
    productId,
    referenceIds: [photoId, styleId],
    styleReferenceIds: [styleId],
  });
  assert.deepEqual(
    selected.brain.products?.map(({ id }) => id),
    [productId],
  );
  assert.deepEqual(
    selected.references.map(({ id }) => id),
    [photoId, styleId],
  );
  assert.equal(selected.references[1]?.kind, "inspiration");
  for (const referenceIds of [[otherPhotoId], [randomUUID()], []])
    assert.throws(() =>
      selectCampaignReferences(context, { productId, referenceIds }),
    );
  assert.throws(() =>
    selectCampaignReferences(context, {
      productId,
      referenceIds: [photoId],
      styleReferenceIds: [photoId],
    }),
  );
  assert.equal(
    campaignGenerationSchema.safeParse({ referenceIds: [photoId, photoId] })
      .success,
    false,
  );
  assert.equal(
    campaignGenerationSchema.safeParse({
      referenceIds: [],
      styleReferenceIds: [styleId],
    }).success,
    false,
  );
  assert.throws(
    () => readCampaignEdit(snapshot, photoId),
    /Select a generated creative/,
  );
});

test("direct generation renders from the requested scene, and retouching preserves the original as a version", async () => {
  const png = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#123456" },
  })
    .png()
    .toBuffer();
  const plan: CampaignPlan = {
    renderMode: "image",
    clarifyingQuestion: null,
    creatives: [
      {
        name: "Morning light",
        concept: "The perfume on white sheets in natural window light.",
        copy: [],
        imagePrompt:
          "A perfume bottle on white sheets with natural window light.",
        referenceIds: [photoId],
        references: [
          {
            id: photoId,
            role: "product",
            instruction: "Preserve the supplied bottle exactly",
          },
        ],
        unusedReferences: [],
      },
    ],
  };
  for (const editing of [false, true]) {
    const events: CreatorEvent[] = [];
    const newId = randomUUID();
    let sourceReads = 0;
    const dependencies: NonNullable<Parameters<typeof runCampaignRequest>[9]> =
      {
        loadCampaignContext: async () => context,
        readCanvas: async () => ({ revision: 1, snapshot }),
        readProjectImage: async (_projectId, _userId, id) => {
          assert.equal(id, sourceId);
          sourceReads++;
          return { bytes: png, mimeType: "image/png" };
        },
        researchCreativeBrief: async () => {
          throw new Error("A direct scene must not trigger Scout research");
        },
        createCampaignPlan: async (
          selected,
          request,
          _feedback,
          research,
          _previous,
          editImage,
        ) => {
          assert.equal(selected.references.length, 1);
          assert.equal(selected.userBrief, request);
          assert.equal(research, undefined);
          assert.equal(Boolean(editImage), editing);
          return structuredClone(plan);
        },
        assessCampaignPlan: async () => [],
        readAgentSettings: async () => ({
          model: null,
          imageModel: "gpt-image-2",
          videoModel: null,
          responseLength: "balanced",
          instructions: "",
        }),
        generateCampaignImage: async (
          _creative,
          _context,
          output,
          _model,
          correction,
        ) => {
          assert.equal(Boolean(correction), editing);
          if (editing) {
            assert.deepEqual(correction?.image, png);
            assert.match(correction!.feedback, /Reduce reflections/);
            assert.equal(output.height, 1350);
          }
          return png;
        },
        reviewAndRefineCampaignImage: async (
          _creative,
          _context,
          _output,
          image,
        ) => ({ image, status: "passed", corrections: 0 }),
        storeProjectImage: async () => ({
          id: newId,
          width: 1080,
          height: editing ? 1350 : 1080,
        }),
        discardProjectImages: async () => {
          throw new Error("A successful revision must keep all versions");
        },
      };
    const answer = await runCampaignRequest(
      randomUUID(),
      randomUUID(),
      randomUUID(),
      editing
        ? "Reduce reflections, keep everything else"
        : "On white sheets, morning light, no text",
      (event) => events.push(event),
      "team",
      undefined,
      [defaultCampaignOutput],
      {
        productId,
        referenceIds: [photoId],
        ...(editing ? { editAssetId: sourceId } : {}),
      },
      dependencies,
    );
    assert.equal(
      answer.approval,
      undefined,
      "Generate directly without another direction approval",
    );
    const scene = events.find((event) => event.type === "campaign_scene");
    assert.ok(scene?.type === "campaign_scene");
    const frame = scene.document.frames[0]!;
    assert.equal(frame.version, editing ? 3 : 1);
    assert.equal(frame.revisionOf, editing ? sourceId : undefined);
    assert.equal(sourceReads, editing ? 1 : 0);
    assert.equal(frame.layers[0]?.type, "image");
    assert.equal(
      snapshot.canvas.objects &&
        (snapshot.canvas.objects as Array<{ data: { assetId: string } }>)[0]
          ?.data.assetId,
      sourceId,
    );
  }
});

test("a missing detail asks within the same conversation without spending on an image", async () => {
  let images = 0;
  const dependencies: NonNullable<Parameters<typeof runCampaignRequest>[9]> = {
    loadCampaignContext: async () => context,
    readCanvas: async () => ({ revision: 1, snapshot }),
    readProjectImage: async () => {
      throw new Error("No edit requested");
    },
    researchCreativeBrief: async () => {
      throw new Error("No research requested");
    },
    createCampaignPlan: async () => ({
      renderMode: "image",
      clarifyingQuestion: "Which product should appear?",
      creatives: null,
    }),
    assessCampaignPlan: async () => [],
    readAgentSettings: async () => ({
      model: null,
      imageModel: "gpt-image-2",
      videoModel: null,
      responseLength: "balanced",
      instructions: "",
    }),
    generateCampaignImage: async () => {
      images++;
      return Buffer.alloc(0);
    },
    reviewAndRefineCampaignImage: async (
      _creative,
      _context,
      _output,
      image,
    ) => ({ image, status: "passed", corrections: 0 }),
    storeProjectImage: async () => {
      throw new Error("No image should be saved");
    },
    discardProjectImages: async () => {},
  };
  const answer = await runCampaignRequest(
    randomUUID(),
    randomUUID(),
    randomUUID(),
    "Create the launch",
    () => {},
    "team",
    undefined,
    [defaultCampaignOutput],
    { referenceIds: [] },
    dependencies,
  );
  assert.equal(answer.content, "Which product should appear?");
  assert.equal(images, 0);
  assert.equal(answer.approval, undefined);
});

test("cost bounds include planning, visual reviews, and a correction for every output", () => {
  const one = campaignCreditBound(
    [defaultCampaignOutput],
    "gpt-image-2",
    "gpt-6-luna",
  );
  const two = campaignCreditBound(
    [defaultCampaignOutput, defaultCampaignOutput],
    "gpt-image-2",
    "gpt-6-luna",
  );
  assert.ok(
    one > 40,
    "Both potential image calls, input references and agent usage are included",
  );
  assert.ok(two > one);
  assert.throws(
    () =>
      campaignCreditBound([defaultCampaignOutput], "unpriced", "gpt-6-luna"),
    /no verified billing/,
  );
});
