import assert from "node:assert/strict";
import test from "node:test";
import { compileBrandBrainContext } from "../src/brand-brain/context";

test("Brand Brain keeps approved rules separate from inspiration and feedback", () => {
  const context = compileBrandBrainContext(
    [
      { kind: "rule", category: "color", content: "Use blue", source: "user" },
      {
        kind: "inspiration",
        category: "imagery",
        content: "Editorial photography",
        source: "user",
      },
      {
        kind: "feedback",
        category: "layout",
        content: "Less crowded",
        source: "user",
      },
    ],
    [
      {
        kind: "inspiration",
        category: "imagery",
        caption: "Warm light",
        filename: "photo.png",
      },
    ],
  );
  assert.deepEqual(context.approvedRules, [
    { category: "color", content: "Use blue", source: "user" },
  ]);
  assert.deepEqual(context.inspirations, [
    { category: "imagery", content: "Editorial photography" },
  ]);
  assert.deepEqual(context.feedback, [
    { category: "layout", content: "Less crowded" },
  ]);
  assert.deepEqual(context.assets, [
    {
      kind: "inspiration",
      category: "imagery",
      caption: "Warm light",
      filename: "photo.png",
      source: "user",
    },
  ]);
});

test("website observations are not silently promoted to approved rules", () => {
  const context = compileBrandBrainContext(
    [
      {
        kind: "rule",
        category: "color",
        content: "Primary: #123456",
        source: "discovery",
        sourceUrl: "https://acme.example/",
      },
      {
        kind: "rule",
        category: "color",
        content: "Primary: #654321",
        source: "user",
      },
    ],
    [
      {
        kind: "rule",
        category: "identity",
        caption: "Detected logo",
        filename: "website-logo.png",
        source: "discovery",
      },
    ],
  );
  assert.equal(context.approvedRules.length, 1);
  assert.equal(context.approvedRules[0].content, "Primary: #654321");
  assert.equal(
    context.websiteObservations[0].sourceUrl,
    "https://acme.example/",
  );
  assert.equal(context.assets[0].source, "discovery");
});
