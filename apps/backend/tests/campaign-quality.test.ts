import assert from "node:assert/strict";
import test from "node:test";
import OpenAI from "openai";
import sharp from "sharp";
import {
  campaignImagePrompt,
  generateCampaignImage,
  validateCampaignReferences,
} from "../src/studio/campaign/campaign.generator";
import {
  reviewCampaignImage,
  reviewAndRefineCampaignImage,
  type CampaignImageReview,
} from "../src/studio/campaign/campaign.quality";
import { campaignPlanningSchema } from "../src/studio/campaign/campaign.schema";
import type { CampaignContext } from "../src/studio/campaign/campaign.context";
import type { CampaignCreative } from "../src/studio/campaign/campaign.types";
import { defaultCampaignOutput as output } from "../src/studio/campaign/campaign.output";

const context: CampaignContext = {
  brandName: "GROUNDED",
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
  fonts: [],
  typographyNotice: null,
  references: ["carton", "logo", "inspiration"].map((id) => ({
    id,
    kind: id === "inspiration" ? "inspiration" : "project",
    category: "reference",
    caption: id,
    source: "user",
    width: 100,
    height: 100,
    image: "data:image/png;base64,cGl4ZWxz",
  })),
};
const creative: CampaignCreative = {
  name: "Chocolate launch",
  concept: "The real carton is the focal point of a restrained flavor launch.",
  copy: ["CHOCOLATE"],
  imagePrompt: "A faithful product creative featuring the supplied carton.",
  referenceIds: ["carton", "logo", "inspiration"],
  direction: {
    recipeId: "studio-product",
    subject: "The real chocolate carton.",
    composition:
      "One dominant carton, one headline, intentional negative space.",
    lightingAndMaterials:
      "Warm directional light and a grounded contact shadow.",
    typography: "One bold headline, small logo, clear contrast.",
    palette: ["#FAF5EA", "#40271F"],
    avoid: ["Stacked opaque panels", "Generic glass substitution"],
  },
  references: [
    {
      id: "carton",
      role: "product",
      instruction: "Preserve carton shape, label, proportions and branding.",
    },
    {
      id: "logo",
      role: "logo",
      instruction: "Preserve the supplied logo identity.",
    },
    {
      id: "inspiration",
      role: "style",
      instruction: "Use its light and spacing only, not its product or copy.",
    },
  ],
  unusedReferences: [],
};
const clean: CampaignImageReview = {
  summary: "Product, copy and hierarchy are intact.",
  issues: [],
};
const defect: CampaignImageReview = {
  summary: "Required copy is misspelled.",
  issues: [
    {
      dimension: "copy",
      severity: "major",
      problem: "CHOCOLATE is misspelled.",
      correction: "Use CHOCOLATE verbatim; preserve the carton and layout.",
    },
  ],
};

const png = () =>
  sharp({
    create: { width: 16, height: 16, channels: 4, background: "#40271F" },
  })
    .png()
    .toBuffer();

function jsonResponse(value: unknown) {
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
          { type: "output_text", annotations: [], text: JSON.stringify(value) },
        ],
      },
    ],
  });
}

test("reference accounting prevents silent omissions, duplication, unknown IDs and inspiration substitution", () => {
  validateCampaignReferences(creative, context);
  const omitted = structuredClone(creative);
  omitted.references!.pop();
  omitted.referenceIds.pop();
  assert.throws(
    () => validateCampaignReferences(omitted, context),
    /Account for each/,
  );
  omitted.unusedReferences = [
    {
      id: "inspiration",
      reason: "The brief requests the brand's existing photographic treatment.",
    },
  ];
  validateCampaignReferences(omitted, context);
  for (const ids of [["unknown"], ["logo", "logo"]]) {
    const invalid = structuredClone(creative);
    invalid.referenceIds = ids;
    assert.throws(
      () => validateCampaignReferences(invalid, context),
      /Account for each/,
    );
  }
  const impersonation = structuredClone(creative);
  impersonation.references![2]!.role = "product";
  assert.throws(
    () => validateCampaignReferences(impersonation, context),
    /cannot substitute/,
  );
  const missing = structuredClone(creative);
  delete missing.direction;
  assert.equal(
    campaignPlanningSchema.safeParse({
      renderMode: "image",
      clarifyingQuestion: null,
      creatives: [missing],
    }).success,
    false,
  );
});

test("structured directions become labeled text and numbered image roles, including preservation in edits", () => {
  const prompt = campaignImagePrompt(creative, context, output);
  assert.match(prompt, /Subject: The real chocolate carton/);
  assert.match(prompt, /EXACT PROMOTIONAL COPY\n\["CHOCOLATE"\]/);
  assert.match(prompt, /"attachment":1,"id":"carton","role":"product"/);
  assert.match(prompt, /"attachment":3,"id":"inspiration","role":"style"/);
  assert.match(prompt, /Preserve existing product-label text/);
  assert.match(
    campaignImagePrompt(creative, context, output, "Correct CHOCOLATE"),
    /"attachment":2,"id":"carton"/,
  );
});

test("Sage receives generated pixels first and real references, not just the planned direction", async (t) => {
  t.mock.method(globalThis, "fetch", async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.text.format.name, "campaign_image_review");
    const content = body.input[1].content;
    assert.equal(content[1].type, "input_image");
    assert.match(content[1].image_url, /^data:image\/png;base64,/);
    assert.equal(content[1].detail, "high");
    assert.equal(JSON.parse(content[2].text).use.role, "product");
    assert.equal(content[3].image_url, context.references[0]!.image);
    assert.match(body.input[0].content, /actual finished creative/);
    return jsonResponse(defect);
  });
  assert.deepEqual(
    await reviewCampaignImage(
      creative,
      context,
      output,
      await png(),
      new OpenAI({ apiKey: "test-no-network", maxRetries: 0 }),
    ),
    defect,
  );
});

test("a targeted edit includes the previous image followed by the original product/logo/style pixels", async (t) => {
  const image = await png();
  const realContext = {
    ...context,
    references: context.references.map((reference) => ({
      ...reference,
      image: `data:image/png;base64,${image.toString("base64")}`,
    })),
  };
  t.mock.method(globalThis, "fetch", async (_input, init) => {
    assert.ok(init?.body instanceof FormData);
    const body = init.body;
    assert.match(
      String(body.get("prompt")),
      /EDIT: Attachment 1 is the current creative/,
    );
    assert.match(
      String(body.get("prompt")),
      /"attachment":2,"id":"carton","role":"product"/,
    );
    const files = body.getAll("image[]") as File[];
    assert.equal(files.length, 4);
    for (const file of files)
      assert.deepEqual(Buffer.from(await file.arrayBuffer()), image);
    return Response.json({ data: [{ b64_json: image.toString("base64") }] });
  });
  assert.deepEqual(
    await generateCampaignImage(
      creative,
      realContext,
      output,
      "gpt-image-2",
      { image, feedback: "Correct the headline only." },
      new OpenAI({ apiKey: "test-no-network", maxRetries: 0 }),
    ),
    image,
  );
});

test("retouch review receives the original pixels and the user's requested change", async (t) => {
  const original = await png();
  t.mock.method(globalThis, "fetch", async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    const content = body.input[1].content;
    assert.equal(
      JSON.parse(content[0].text).userBrief,
      "Reduce reflections, keep the rest",
    );
    assert.match(
      content.at(-2).text,
      /Original creative before the requested edit/,
    );
    assert.equal(
      content.at(-1).image_url,
      `data:image/png;base64,${original.toString("base64")}`,
    );
    return jsonResponse(clean);
  });
  await reviewCampaignImage(
    creative,
    { ...context, userBrief: "Reduce reflections, keep the rest" },
    output,
    await png(),
    new OpenAI({ apiKey: "test-no-network", maxRetries: 0 }),
    original,
  );
});

test("finished-image quality permits one correction and keeps drafts through provider failure or regression", async () => {
  const original = Buffer.from("original"),
    corrected = Buffer.from("corrected");
  for (const scenario of [
    "pass",
    "minor",
    "fixed",
    "still-broken",
    "regression",
    "new-major",
    "review-failure",
    "edit-failure",
    "second-review-failure",
  ] as const) {
    let reviews = 0,
      edits = 0;
    const messages: Array<{ agent: string; content: string }> = [];
    const result = await reviewAndRefineCampaignImage(
      creative,
      context,
      output,
      original,
      "gpt-image-2",
      (agent, content) => messages.push({ agent, content }),
      {
        review: async (_creative, _context, _output, image) => {
          reviews++;
          if (
            scenario === "review-failure" ||
            (scenario === "second-review-failure" && reviews === 2)
          )
            throw new Error("Network unavailable");
          if (scenario === "pass") return clean;
          if (scenario === "minor")
            return {
              ...defect,
              issues: [
                {
                  ...defect.issues[0]!,
                  dimension: "hierarchy",
                  severity: "minor",
                },
              ],
            };
          if (reviews === 1) {
            assert.equal(image, original);
            return scenario === "new-major"
              ? {
                  ...defect,
                  issues: [
                    ...defect.issues,
                    {
                      ...defect.issues[0]!,
                      severity: "minor",
                      dimension: "hierarchy",
                    },
                  ],
                }
              : defect;
          }
          assert.equal(image, corrected);
          if (scenario === "fixed") return clean;
          if (scenario === "new-major")
            return {
              ...defect,
              issues: [{ ...defect.issues[0]!, dimension: "product" }],
            };
          if (scenario === "regression")
            return {
              ...defect,
              issues: [
                defect.issues[0]!,
                { ...defect.issues[0]!, dimension: "product" },
              ],
            };
          return defect;
        },
        generate: async (_creative, _context, _output, _model, correction) => {
          edits++;
          assert.equal(correction?.image, original);
          assert.match(correction!.feedback, /preserve the carton/);
          if (scenario === "edit-failure")
            throw new Error("Insufficient credits");
          return corrected;
        },
      },
    );
    assert.ok(edits <= 1, scenario);
    assert.ok(reviews <= 2, scenario);
    assert.equal(
      result.image,
      scenario === "fixed" ? corrected : original,
      scenario,
    );
    assert.equal(
      result.status,
      scenario === "pass" || scenario === "fixed"
        ? "passed"
        : scenario === "minor"
          ? "notes"
          : scenario === "review-failure"
            ? "unreviewed"
            : "needs-work",
      scenario,
    );
    assert.ok(
      messages.some(({ agent }) => agent === "brand"),
      scenario,
    );
  }
});
