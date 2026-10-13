import assert from "node:assert/strict";
import test from "node:test";
import type { BrandBrainContext } from "../src/brand-brain/context";
import {
  CampaignPaletteError,
  repairCampaignContrast,
  validateCampaignContrast,
} from "../src/studio/campaign/campaign.contrast";
import {
  campaignDocumentSchema,
  validateCampaign,
} from "../src/studio/campaign/campaign.schema";
import type {
  CampaignDocument,
  CampaignLayer,
} from "../src/studio/campaign/campaign.types";

const fonts = [{ family: "Instrument Sans", variants: ["700"] }];
function brain(colors: string[] = ["#123456", "#FFFFFF"]): BrandBrainContext {
  return {
    approvedRules: colors.map((color) => ({
      category: "color",
      content: `Primary: ${color}`,
      source: "user",
    })),
    websiteObservations: [
      {
        category: "color",
        content: "#000000",
        sourceUrl: "https://example.test",
      },
    ],
    inspirations: [{ category: "color", content: "#000000" }],
    feedback: [],
    assets: [],
  };
}
function fixture(): CampaignDocument {
  return {
    version: 1,
    frames: [
      {
        id: "frame",
        formatId: "square_1080",
        width: 1080,
        height: 1080,
        name: "Launch",
        concept: "A brand-specific editorial launch",
        background: "#FFFFFF",
        layers: [
          {
            id: "headline",
            type: "text",
            x: 60,
            y: 60,
            width: 700,
            height: 120,
            text: "Meet your next chapter",
            fontFamily: "Instrument Sans",
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.1,
            align: "left",
            fill: "#EEEEEE",
          },
        ],
      },
    ],
  };
}
function headline(document: CampaignDocument) {
  const layer = document.frames[0]!.layers.find(
    (layer) => layer.id === "headline",
  )!;
  assert.equal(layer.type, "text");
  if (layer.type !== "text") throw new Error("Expected headline text");
  return layer;
}
const image: CampaignLayer = {
  id: "image",
  type: "image",
  x: 0,
  y: 0,
  width: 1080,
  height: 1080,
  assetId: "photo",
  fit: "cover",
};

test("low contrast is repaired with approved colors, preserving the design and Brand Brain", () => {
  const document = fixture(),
    context = brain(),
    original = structuredClone(context);
  const before = structuredClone(headline(document));
  assert.throws(
    () => validateCampaignContrast(document),
    /headline.*#EEEEEE on #FFFFFF.*requires 4.5/,
  );
  const changes = repairCampaignContrast(document, context);
  assert.deepEqual(changes, [
    {
      frameId: "frame",
      layerId: "headline",
      previousFill: "#EEEEEE",
      fill: "#123456",
      background: "#FFFFFF",
      addedBacking: false,
    },
  ]);
  assert.deepEqual(headline(document), { ...before, fill: "#123456" });
  assert.equal(document.frames[0]!.layers.length, 1);
  validateCampaign(campaignDocumentSchema.parse(document), new Set(), fonts);
  assert.deepEqual(
    repairCampaignContrast(document, context),
    [],
    "Repair is idempotent",
  );
  assert.deepEqual(context, original);
});

test("readable text and existing opaque backings are left untouched", () => {
  const document = fixture();
  document.frames[0]!.layers.unshift({
    id: "panel",
    type: "rect",
    x: 40,
    y: 40,
    width: 800,
    height: 200,
    fill: "#123456",
    radius: 0,
  });
  headline(document).fill = "#FFFFFF";
  const original = structuredClone(document);
  assert.deepEqual(repairCampaignContrast(document, brain()), []);
  assert.deepEqual(document, original);
  validateCampaignContrast(document);
});

test("unknown backgrounds get editable approved backings above imagery or irregular shapes", () => {
  const backgrounds: CampaignLayer[] = [
    image,
    {
      id: "partial",
      type: "rect",
      x: 50,
      y: 50,
      width: 100,
      height: 80,
      fill: "#123456",
      radius: 0,
    },
    {
      id: "rounded",
      type: "rect",
      x: 50,
      y: 50,
      width: 800,
      height: 200,
      fill: "#123456",
      radius: 30,
    },
    {
      id: "ellipse",
      type: "ellipse",
      x: 50,
      y: 50,
      width: 800,
      height: 200,
      fill: "#123456",
      radius: 0,
    },
    {
      id: "path",
      type: "path",
      x: 50,
      y: 50,
      width: 800,
      height: 200,
      fill: "#123456",
      d: "M0 0 L800 0 L800 200 Z",
    },
  ];
  for (const background of backgrounds) {
    for (const later of [false, true]) {
      const document = fixture(),
        frame = document.frames[0]!;
      headline(document).fill = "#FFFFFF";
      if (later) frame.layers.push(structuredClone(background));
      else frame.layers.unshift(structuredClone(background));
      const before = structuredClone(headline(document));
      assert.throws(() => validateCampaignContrast(document), /opaque backing/);
      const changes = repairCampaignContrast(document, brain());
      assert.equal(changes[0]!.addedBacking, true);
      assert.deepEqual(
        headline(document),
        before,
        "Keep readable original text color when possible",
      );
      assert.deepEqual(
        frame.layers[0],
        background,
        "Source artwork stays untouched",
      );
      assert.equal(frame.layers[1]!.type, "rect");
      assert.equal(frame.layers[2]!.id, "headline");
      validateCampaign(
        campaignDocumentSchema.parse(document),
        new Set(["photo"]),
        fonts,
      );
      assert.deepEqual(repairCampaignContrast(document, brain()), []);
    }
  }
});

test("backings respect frame bounds, avoid ID collisions and do not cover adjacent text", () => {
  const document = fixture(),
    frame = document.frames[0]!;
  headline(document).x = 0;
  headline(document).y = 0;
  const adjacent = { ...headline(document), id: "subtitle", y: 125 };
  frame.layers.unshift(structuredClone(image));
  frame.layers.push(adjacent, {
    id: "headline-contrast",
    type: "rect",
    x: 1000,
    y: 1000,
    width: 20,
    height: 20,
    fill: "#123456",
    radius: 0,
  });
  const changes = repairCampaignContrast(document, brain());
  assert.equal(changes.length, 2);
  assert.ok(frame.layers.some((layer) => layer.id === "headline-contrast-1"));
  validateCampaign(
    campaignDocumentSchema.parse(document),
    new Set(["photo"]),
    fonts,
  );
  assert.deepEqual(repairCampaignContrast(document, brain()), []);
});

test("an impossible approved palette asks for permission instead of using website or inspiration colors", () => {
  const document = fixture(),
    context = brain(["#EEE", "#FFF"]);
  const original = structuredClone(context);
  assert.throws(
    () => repairCampaignContrast(document, context),
    (error: unknown) => {
      assert.ok(error instanceof CampaignPaletteError);
      assert.match(error.question, /approved colors/);
      assert.match(error.question, /brief does not need changing/);
      return true;
    },
  );
  assert.deepEqual(context, original);
});

test("without approved colors, website colors and neutral campaign-only options can repair text", () => {
  const document = fixture(),
    context = brain([]),
    original = structuredClone(context);
  repairCampaignContrast(document, context);
  assert.equal(headline(document).fill, "#000000");
  context.websiteObservations = [];
  headline(document).fill = "#EEEEEE";
  repairCampaignContrast(document, context);
  assert.equal(headline(document).fill, "#18181B");
  validateCampaignContrast(document);
  assert.deepEqual(context.approvedRules, original.approvedRules);
  assert.deepEqual(context.inspirations, original.inspirations);
});

test("repair does not disable geometry, font or image authorization checks", () => {
  const document = fixture();
  repairCampaignContrast(document, brain());
  const text = headline(document);
  text.x = 1000;
  assert.throws(() => validateCampaign(document, new Set(), fonts), /exceeds/);
  text.x = 60;
  text.fontFamily = "Unknown";
  assert.throws(
    () => validateCampaign(document, new Set(), fonts),
    /unavailable/,
  );
  text.fontFamily = "Instrument Sans";
  document.frames[0]!.layers.unshift(structuredClone(image));
  repairCampaignContrast(document, brain());
  assert.throws(
    () => validateCampaign(document, new Set(), fonts),
    /unavailable image/,
  );
});
