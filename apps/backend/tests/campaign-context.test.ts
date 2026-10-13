import assert from "node:assert/strict";
import test from "node:test";
import {
  studioCanvasContext,
  studioUploadIds,
} from "../src/studio/canvas/canvas.context";
import { campaignSystemPrompt } from "../src/studio/campaign/campaign.generator";
import { buildCreativeDirectionSystemPrompt } from "../src/studio/prompts/creative-direction.prompt";
import type { CanvasSnapshot } from "../src/studio/canvas/canvas.schema";

test("canvas context distinguishes project uploads from generated imagery and filters metadata", () => {
  const snapshot: CanvasSnapshot = {
    version: 1,
    canvas: {
      objects: [
        {
          type: "Image",
          width: 1000,
          height: 500,
          scaleX: 0.5,
          scaleY: 0.5,
          clipPath: {
            left: 0,
            top: 0,
            width: 500,
            height: 250,
            absolutePositioned: true,
          },
          data: {
            assetId: "upload",
            kind: "upload",
            name: "product.png",
            arbitrary: "not relevant",
          },
        },
        {
          type: "Image",
          data: {
            assetId: "generated",
            kind: "campaign",
            name: "Generated art",
          },
        },
        {
          type: "Textbox",
          text: "Hello",
          fontFamily: "Instrument Sans",
          fill: "#123456",
        },
      ],
    },
    viewport: [1, 0, 0, 1, 0, 0],
    favorites: [],
  };
  assert.deepEqual(studioUploadIds(snapshot), [
    { id: "upload", name: "product.png" },
  ]);
  assert.equal(studioCanvasContext(snapshot)[2]!.text, "Hello");
  assert.equal(studioCanvasContext(snapshot)[0]!.scaleX, 0.5);
  assert.deepEqual(studioCanvasContext(snapshot)[0]!.clipPath, {
    left: 0,
    top: 0,
    width: 500,
    height: 250,
    absolutePositioned: true,
  });
  assert.ok(
    !JSON.stringify(studioCanvasContext(snapshot)).includes("not relevant"),
  );
  assert.deepEqual(studioUploadIds(null), []);
  assert.deepEqual(studioCanvasContext(null), []);
});

test("design explanations are client-facing, grounded in saved work and do not claim unseen pixels", () => {
  assert.match(
    campaignSystemPrompt,
    /why this hierarchy, composition, typography, colors and imagery serve the brief/,
  );
  assert.match(
    campaignSystemPrompt,
    /never treat them as approved Brand Brain rules/,
  );
  const prompt = buildCreativeDirectionSystemPrompt({
    studioMode: "creation",
    canvas: [{ text: "SODA" }],
  });
  assert.match(prompt, /saved design approaches/);
  assert.match(prompt, /Canvas metadata is not a screenshot/);
  assert.match(prompt, /without starting a new/);
  assert.match(prompt, /never private chain-of-thought/);
});
