import assert from "node:assert/strict";
import test from "node:test";
import {
  identityPlanSchema,
  logoSceneSchema,
  validateLogoScene,
} from "../src/studio/identity.schema";

const scene = {
  background: "#F4F1EA",
  foreground: "#18252A",
  accent: "#245DE0",
  fontFamily: "Instrument Sans",
  fontWeight: 600,
  letterSpacing: 2,
  paths: [
    {
      d: "M 20 20 L 180 20 L 180 180 L 20 180 Z",
      fill: "none",
      stroke: "foreground",
      strokeWidth: 8,
    },
  ],
};

test("identity plan requires exactly three directions", () => {
  const direction = {
    name: "Working Layer",
    strategicAngle: "A clear operational layer over existing systems.",
    markIdea: "A precise hinge between two parallel forms.",
  };
  assert.equal(
    identityPlanSchema.safeParse({
      directions: [direction, direction, direction],
    }).success,
    true,
  );
  assert.equal(
    identityPlanSchema.safeParse({ directions: [direction] }).success,
    false,
  );
});

test("logo scene accepts editable vector paths and rejects unsafe input", () => {
  const parsed = logoSceneSchema.parse(scene);
  assert.doesNotThrow(() => validateLogoScene(parsed));
  assert.throws(
    () =>
      validateLogoScene({
        ...parsed,
        paths: [{ ...parsed.paths[0], d: "M 0 0 <script>" }],
      }),
    /unsupported SVG command/,
  );
  assert.throws(
    () =>
      validateLogoScene({
        ...parsed,
        paths: [{ ...parsed.paths[0], d: "M 999 0 L 20 20 Z" }],
      }),
    /exceeds/,
  );
  assert.equal(
    logoSceneSchema.safeParse({ ...scene, fontFamily: "Unknown Font" }).success,
    false,
  );
});
