import assert from "node:assert/strict";
import test from "node:test";
import { assessCampaignPlan } from "../src/studio/campaign/campaign.judgment";
import OpenAI from "openai";
import {
  reviewCampaignIssues,
  campaignReviewSchema,
} from "../src/studio/campaign/campaign.generator";
import { zodTextFormat } from "openai/helpers/zod";
import type { CampaignContext } from "../src/studio/campaign/campaign.context";
import type { CampaignPlan } from "../src/studio/campaign/campaign.types";

test("campaign review confirms real conflicts, allows unsubstantiated concerns, and never hides provider failures", async (t) => {
  const oldOpenai = process.env.OPENAI_API_KEY;
  const oldJev = process.env.TYPESAFE_API_KEY;
  process.env.OPENAI_API_KEY = "test-no-network";
  process.env.TYPESAFE_API_KEY = "test-no-network";
  const context: CampaignContext = {
    brandName: "Acme",
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
    typographyNotice:
      "No brand fonts were detected. Instrument Sans is provisional.",
    references: [
      {
        id: "product",
        kind: "project",
        category: "reference",
        caption: "Product",
        source: "user",
        width: 100,
        height: 100,
        image: "data:image/png;base64,private",
      },
    ],
  };
  const plan: CampaignPlan = {
    renderMode: "image",
    clarifyingQuestion: null,
    creatives: [
      {
        name: "Launch",
        concept: "Introduce the real Acme offering.",
        copy: ["Meet Acme"],
        imagePrompt:
          "A complete launch creative with clear Acme typography on a white background.",
        referenceIds: ["product"],
      },
    ],
  };
  let score = 1;
  let reviewCalls = 0;
  let failure = false;
  let issues: Array<{
    dimension: "brandFit";
    problem: string;
    evidence: string;
    correction: string;
  }> = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    const body = JSON.parse(String(init?.body));
    if (String(input).includes("api.typesafe.ai")) {
      assert.match(
        body.questions.brandFit.instructions,
        /Missing rules or assets are not violations/,
      );
      assert.match(
        body.questions.brandFit.instructions,
        /no editable font is required/,
      );
      return Response.json({
        answers: {
          grounding: { type: "score", score: 3, confidence: 1 },
          brandFit: { type: "score", score, confidence: 0.8 },
          specificity: { type: "score", score: 3, confidence: 1 },
        },
      });
    }
    assert.ok(String(input).includes("api.openai.com"));
    reviewCalls++;
    assert.equal(body.text.format.name, "campaign_review");
    const review = JSON.parse(body.input[1].content);
    assert.deepEqual(review.dimensions, ["brandFit"]);
    assert.deepEqual(review.plan, plan);
    assert.ok(!JSON.stringify(review).includes("data:image"));
    assert.match(body.input[0].content, /cite the exact supplied rule or fact/);
    if (failure)
      return Response.json(
        { error: { message: "Reviewer unavailable", type: "server_error" } },
        { status: 503 },
      );
    return Response.json({
      id: "response",
      object: "response",
      status: "completed",
      output: [
        {
          id: "message",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [
            {
              type: "output_text",
              text: JSON.stringify({ issues }),
              annotations: [],
            },
          ],
        },
      ],
    });
  });
  const review: typeof reviewCampaignIssues = (
    context,
    request,
    plan,
    dimensions,
  ) =>
    reviewCampaignIssues(
      context,
      request,
      plan,
      dimensions,
      new OpenAI({ apiKey: "test-no-network", maxRetries: 0 }),
    );
  try {
    assert.deepEqual(
      await assessCampaignPlan(context, "Introduce Acme", plan, review),
      [],
      "Missing brand identity must not become a blanket rejection",
    );
    assert.equal(reviewCalls, 1);
    context.brain.approvedRules = [
      { category: "color", content: "Primary: #123456", source: "user" },
    ];
    issues = [
      {
        dimension: "brandFit",
        problem: "The artwork brief requests blue.",
        evidence: "Primary: #123456",
        correction: "Use #123456 in the artwork brief.",
      },
    ];
    assert.deepEqual(
      await assessCampaignPlan(context, "Introduce Acme", plan, review),
      [
        "brandFit: The artwork brief requests blue. Evidence: Primary: #123456 Correction: Use #123456 in the artwork brief.",
      ],
    );
    score = 3;
    assert.deepEqual(
      await assessCampaignPlan(context, "Introduce Acme", plan, review),
      [],
    );
    assert.equal(
      reviewCalls,
      2,
      "Passing scores do not spend another review call",
    );
    score = 1;
    failure = true;
    await assert.rejects(
      assessCampaignPlan(context, "Introduce Acme", plan, review),
      /Reviewer unavailable/,
    );
    assert.equal(
      reviewCalls,
      3,
      "Provider failures are not retried or accepted",
    );
    const format = zodTextFormat(campaignReviewSchema, "campaign_review");
    assert.equal(format.strict, true);
    assert.equal(format.schema.additionalProperties, false);
  } finally {
    if (oldOpenai === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldOpenai;
    if (oldJev === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = oldJev;
  }
});
