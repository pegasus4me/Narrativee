import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";
import {
  campaignDocumentSchema,
  campaignPlanSchema,
  campaignPlanningSchema,
  campaignOutputsSchema,
  validateCampaign,
  type CampaignDocument,
} from "../src/studio/campaign/campaign.schema";
import {
  canvasSnapshotSchema,
  validateCanvasSnapshot,
} from "../src/studio/canvas/canvas.schema";

const fonts = [{ family: "Instrument Sans", variants: ["regular", "700"] }];

test("output selections validate platforms, exact presets, custom pixels, duplicates and the batch limit", () => {
  const selected = [
    {
      platform: "instagram",
      formatId: "portrait_1080",
      width: 1080,
      height: 1350,
    },
    {
      platform: "linkedin",
      formatId: "landscape_1200",
      width: 1200,
      height: 628,
    },
    { platform: "pinterest", formatId: "custom", width: 900, height: 1600 },
  ];
  assert.deepEqual(campaignOutputsSchema.parse(selected), selected);
  for (const outputs of [
    [],
    [selected[0], selected[0]],
    [{ ...selected[0], platform: "unknown" }],
    [{ ...selected[0], width: 1200 }],
    [{ ...selected[0], platform: "tiktok" }],
    [{ ...selected[2], width: 63 }],
    [{ ...selected[2], height: 4097 }],
    [{ ...selected[2], width: 900.5 }],
    [{ ...selected[2], height: Infinity }],
    [{ ...selected[2], publish: true }],
    Array.from({ length: 13 }, (_, index) => ({
      ...selected[2],
      width: 900 + index,
    })),
  ])
    assert.equal(campaignOutputsSchema.safeParse(outputs).success, false);
  assert.equal(
    campaignOutputsSchema.safeParse([
      { ...selected[2], width: 64, height: 4096 },
    ]).success,
    false,
  );
});

test("campaign response format uses OpenAI-compatible unions and strict objects", () => {
  const format = zodTextFormat(campaignPlanningSchema, "campaign_plan");
  assert.equal(format.strict, true);
  assert.equal(format.schema.type, "object");
  assert.equal(format.schema.anyOf, undefined, "The root must not be a union");
  const unsupported = new Set([
    "oneOf",
    "allOf",
    "not",
    "dependentRequired",
    "dependentSchemas",
    "if",
    "then",
    "else",
  ]);
  function check(value: unknown, path = "schema"): void {
    if (Array.isArray(value)) {
      value.forEach((child, index) => check(child, `${path}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(node)) {
      assert.ok(
        !unsupported.has(key),
        `${path}.${key} is unsupported by OpenAI`,
      );
      check(child, `${path}.${key}`);
    }
    if (node.type === "object") {
      assert.equal(node.additionalProperties, false, path);
      assert.deepEqual(
        [...(node.required as string[])].sort(),
        Object.keys(node.properties as object).sort(),
        `${path} must require every field`,
      );
    }
  }
  check(format.schema);
  assert.match(JSON.stringify(format.schema), /"anyOf"/);
});

test(
  "live OpenAI accepts the campaign schema and asks for missing details",
  { skip: process.env.RUN_LIVE_CAMPAIGN_TEST !== "1" },
  async () => {
    const { default: dotenv } = await import("dotenv");
    dotenv.config({ quiet: true });
    const { createCampaignPlan } = await import(
      "../src/studio/campaign/campaign.generator"
    );
    const plan = await createCampaignPlan(
      {
        brandName: "Schema acceptance smoke test",
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
        },
        fonts: [{ ...fonts[0]!, category: "sans-serif" }],
        typographyNotice: null,
        references: [],
      },
      "Create a campaign. The offering and objective are unknown; ask one clarifying question rather than inventing them.",
    );
    assert.ok(plan.clarifyingQuestion);
    assert.equal(plan.creatives, null);
    assert.equal(plan.renderMode, "image");
  },
);

export const campaignFixture: CampaignDocument = {
  version: 1,
  frames: [
    {
      id: "frame",
      formatId: "square_1080",
      width: 1080,
      height: 1080,
      name: "Launch",
      concept: "An editorial launch composition",
      background: "#FFFFFF",
      layers: [
        {
          id: "headline",
          type: "text",
          x: 60,
          y: 60,
          width: 700,
          height: 200,
          text: "Meet your next chapter.",
          fontFamily: "Instrument Sans",
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.1,
          align: "left",
          fill: "#18181B",
        },
      ],
    },
  ],
};
test("campaign contract is structured, validates geometry/fonts/contrast/assets, and allows future frame sizes", () => {
  validateCampaign(
    campaignDocumentSchema.parse(campaignFixture),
    new Set(),
    fonts,
  );
  const resized = structuredClone(campaignFixture);
  resized.frames[0]!.width = 800;
  resized.frames[0]!.height = 1400;
  resized.frames[0]!.formatId = "test_portrait";
  validateCampaign(campaignDocumentSchema.parse(resized), new Set(), fonts);
  const bad = (
    mutate: (document: CampaignDocument) => void,
    message: RegExp,
  ) => {
    const document = structuredClone(campaignFixture);
    mutate(document);
    assert.throws(() => validateCampaign(document, new Set(), fonts), message);
  };
  bad((document) => {
    document.frames[0]!.layers[0]!.x = 1000;
  }, /exceeds/);
  bad((document) => {
    const layer = document.frames[0]!.layers[0]!;
    if (layer.type === "text") layer.fontFamily = "Missing Font";
  }, /unavailable/);
  bad((document) => {
    const layer = document.frames[0]!.layers[0]!;
    if (layer.type === "text") layer.fill = "#FFFFFF";
  }, /contrast/);
  bad((document) => {
    document.frames[0]!.layers.push({
      id: "photo",
      type: "image",
      x: 0,
      y: 300,
      width: 400,
      height: 400,
      assetId: "foreign",
      fit: "contain",
    });
  }, /unavailable image/);
  bad((document) => {
    document.frames[0]!.layers.push(
      structuredClone(document.frames[0]!.layers[0]!),
    );
  }, /repeats a layer/);
  const overImage = structuredClone(campaignFixture);
  overImage.frames[0]!.layers.unshift({
    id: "photo",
    type: "image",
    x: 0,
    y: 0,
    width: 1080,
    height: 1080,
    assetId: "photo",
    fit: "cover",
  });
  assert.throws(
    () => validateCampaign(overImage, new Set(["photo"]), fonts),
    /opaque backing/,
  );
  overImage.frames[0]!.layers.splice(1, 0, {
    id: "text-backing",
    type: "rect",
    x: 40,
    y: 40,
    width: 800,
    height: 240,
    fill: "#FFFFFF",
    radius: 0,
  });
  validateCampaign(overImage, new Set(["photo"]), fonts);
  assert.equal(
    campaignPlanSchema.parse({
      clarifyingQuestion: "What are we launching?",
      renderMode: "image",
      creatives: null,
    }).creatives,
    null,
  );
});

test("canvas snapshots reject remote images, unsafe primitives and invalid geometry", () => {
  const value = canvasSnapshotSchema.parse({
    version: 1,
    canvas: {
      objects: [
        {
          type: "Rect",
          left: 10,
          top: 20,
          width: 100,
          height: 100,
          fill: "#123456",
        },
      ],
    },
    viewport: [1, 0, 0, 1, 0, 0],
    favorites: [],
  });
  assert.deepEqual(validateCanvasSnapshot(value), []);
  const id = "3a6435d6-6cd1-4083-b949-f882274e3cd1";
  value.canvas.objects = [
    { type: "Image", data: { assetId: id }, width: 100, height: 100 },
  ];
  assert.deepEqual(validateCanvasSnapshot(value), [id]);
  value.canvas.objects = [
    {
      type: "Image",
      data: { assetId: id },
      src: "https://evil.example/tracker.png",
    },
  ];
  assert.throws(() => validateCanvasSnapshot(value), /external image/);
  value.canvas.objects = [
    { type: "Rect", fill: { type: "pattern", source: "https://evil.example" } },
  ];
  assert.throws(() => validateCanvasSnapshot(value), /unsupported effects/);
  value.canvas.objects = [{ type: "Group", objects: [] }];
  assert.throws(() => validateCanvasSnapshot(value), /Unsupported/);
  value.canvas.objects = [{ type: "Rect", left: Infinity }];
  assert.throws(() => validateCanvasSnapshot(value), /geometry/);
  value.canvas.objects = [
    { type: "Rect", clipPath: { type: "Image", src: "https://evil.example" } },
  ];
  assert.throws(() => validateCanvasSnapshot(value), /rectangular/);
  value.canvas.objects = [];
  value.canvas.overlayImage = { type: "Image", src: "https://evil.example" };
  assert.throws(() => validateCanvasSnapshot(value), /solid color/);
});
