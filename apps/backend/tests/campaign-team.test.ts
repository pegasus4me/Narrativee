import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";
import {
  creativeResearchSchema,
  researchCreativeBrief,
  createCampaignPlan,
} from "../src/studio/campaign/campaign.generator";
import type { CampaignContext } from "../src/studio/campaign/campaign.context";

test("the Research handoff has a strict bounded provider contract", () => {
  const format = zodTextFormat(creativeResearchSchema, "creative_research");
  assert.equal(format.strict, true);
  assert.equal(format.schema.additionalProperties, false);
  assert.deepEqual(format.schema.required, [
    "summary",
    "creativeAngle",
    "limitations",
  ]);
  assert.throws(() =>
    creativeResearchSchema.parse({
      summary: "x".repeat(801),
      creativeAngle: "An angle",
      limitations: [],
    }),
  );
});

test(
  "live Research hands a qualified brief to Creator without inventing performance or generating an image",
  { skip: process.env.RUN_LIVE_TEAM_TEST !== "1" },
  async () => {
    const { default: dotenv } = await import("dotenv");
    dotenv.config({ quiet: true });
    const context: CampaignContext = {
      brandName: "Narrativee schema smoke test",
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
      fonts: [
        {
          family: "Instrument Sans",
          variants: ["regular", "700"],
          category: "sans-serif",
        },
      ],
      typographyNotice: null,
      references: [],
    };
    const request =
      "Create a campaign. We have not supplied the product or objective. Ask for the missing offering rather than inventing it.";
    const research = await researchCreativeBrief(context, request);
    assert.ok(research.summary);
    assert.ok(research.creativeAngle);
    assert.ok(
      research.limitations.length,
      "No competitor or performance data is supplied",
    );
    const plan = await createCampaignPlan(context, request, [], research);
    assert.ok(plan.clarifyingQuestion);
    assert.equal(plan.creatives, null);
    assert.equal(plan.renderMode, "image");
  },
);
