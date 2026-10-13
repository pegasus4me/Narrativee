import assert from "node:assert/strict";
import test from "node:test";
import { resolveCampaignFonts } from "../src/studio/campaign/campaign.fonts";

const catalog = ["Instrument Sans", "Fraunces", "Inter"].map((family) => ({
  family,
  category: "sans-serif",
  variants: ["regular", "700"],
}));

test("unavailable website fonts use explicit provisional options without changing Brand Brain", () => {
  const brain = {
    approvedRules: [],
    websiteObservations: [
      "Helvetica",
      "Ano",
      "Arial",
      "Helvetica Neue",
      "WindsorEF",
    ].map((family) => ({
      category: "typography",
      content: `Detected font: ${family}`,
      sourceUrl: "https://drinkolipop.com/",
    })),
  };
  const original = structuredClone(brain);
  const result = resolveCampaignFonts(brain, catalog);
  assert.deepEqual(
    result.fonts.map((font) => font.family),
    ["Instrument Sans", "Fraunces"],
  );
  assert.match(result.typographyNotice!, /Ano.*unavailable/);
  assert.match(result.typographyNotice!, /provisional.*Brand Kit is unchanged/);
  assert.deepEqual(brain, original);
});

test("approved fonts override website findings and unavailable approvals never fall back", () => {
  const brain = {
    approvedRules: [
      {
        category: "typography",
        content: "Headings: inter (weight 700)",
        source: "user",
      },
    ],
    websiteObservations: [
      { category: "typography", content: "Headings: Ano", sourceUrl: null },
    ],
  };
  const result = resolveCampaignFonts(brain, catalog);
  assert.deepEqual(
    result.fonts.map((font) => font.family),
    ["Inter"],
  );
  assert.equal(result.typographyNotice, null);
  brain.approvedRules[0]!.content = "Headings: Ano";
  assert.throws(
    () => resolveCampaignFonts(brain, catalog),
    /Approved brand font Ano.*not be substituted/,
  );
});

test("supported detected fonts remain available and an unusable catalog fails explicitly", () => {
  const brain = {
    approvedRules: [],
    websiteObservations: ["Inter", "Ano"].map((family) => ({
      category: "typography",
      content: `Body: ${family}`,
      sourceUrl: null,
    })),
  };
  const result = resolveCampaignFonts(brain, catalog);
  assert.deepEqual(
    result.fonts.map((font) => font.family),
    ["Inter"],
  );
  assert.match(result.typographyNotice!, /Ano/);
  assert.throws(() => resolveCampaignFonts(brain, []), /available Google Font/);
  assert.match(
    resolveCampaignFonts(
      { approvedRules: [], websiteObservations: [] },
      catalog,
    ).typographyNotice!,
    /No brand fonts were detected/,
  );
});
