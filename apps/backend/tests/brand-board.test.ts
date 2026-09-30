import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import {
  directionSchema,
  type BrandDirection,
} from "../src/brand-board/board.schema";
import {
  prepareBoardResearch,
  validateDirectionEvidence,
} from "../src/brand-board/research";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  contrastRatio,
  renderBrandBoard,
  wrapText,
} from "../src/brand-board/render";

const direction: BrandDirection = {
  name: "Quiet Signals",
  thesis: "A more human visual language for an intelligent technical product.",
  rationale: {
    text: "The direction gives a technical product a calmer, more editorial expression without losing its precision.",
    evidenceIds: ["B1"],
  },
  differentiation: {
    text: "It replaces the category's familiar glowing grids with tactility, negative space, and a sharper voice.",
    evidenceIds: ["C1"],
  },
  palette: {
    background: "#F1EFE9",
    foreground: "#142421",
    accent: "#BD4B2E",
    secondary: "#ADB9A4",
  },
  typography: {
    display: "Georgia",
    body: "Avenir Next",
    reason: "An editorial headline and clear supporting information.",
  },
  imageBrief:
    "A restrained abstract sculpture of layered paper and brushed metal in soft daylight, with considered material detail and generous negative space.",
  headline: "Make knowledge move",
  applicationLabel: "Launch concept",
  applicationCopy:
    "A clearer way to show what your product knows and why it matters.",
};

const diagnosis = {
  companyName: "Context.dev",
  summary: "A technical product for teams.",
  observations: [
    {
      type: "product",
      statement: "The company offers a technical product.",
      confidence: 0.9,
      evidence: [
        {
          statement: "Product claim",
          sourceUrl: "https://www.context.dev/",
          sourceText: "A product description.",
        },
      ],
    },
  ],
  inferences: [],
  contradictions: [],
  openQuestions: [],
};

const competitors = {
  competitors: [
    {
      name: "Example competitor",
      url: "https://example.com/",
      positioning: "Technical platform",
      audience: "Teams",
      primaryClaim: "Fast work",
      voice: ["direct"],
      visualPatterns: ["dark gradients"],
      evidence: [
        {
          statement: "Dark gradients",
          sourceUrl: "https://example.com/",
          sourceText: "Homepage visual",
        },
      ],
    },
  ],
  categoryPatterns: ["dark gradients"],
  similarities: [],
  differentiationOpportunities: ["more editorial visual language"],
  caveats: [],
};

test("board research requires completed diagnosis and competitor evidence", () => {
  assert.throws(
    () =>
      prepareBoardResearch({
        id: "test",
        url: "https://www.context.dev/",
        diagnosis: null,
        competitorAnalysis: competitors,
      }),
    /Brand diagnosis is missing/,
  );
  assert.throws(
    () =>
      prepareBoardResearch({
        id: "test",
        url: "https://www.context.dev/",
        diagnosis,
        competitorAnalysis: null,
      }),
    /Competitor analysis is missing/,
  );
  const research = prepareBoardResearch({
    id: "test",
    url: "https://www.context.dev/",
    diagnosis,
    competitorAnalysis: competitors,
  });
  assert.deepEqual(
    research.evidence.map((item) => item.id),
    ["B1", "C1"],
  );
  validateDirectionEvidence(direction, research.evidence);
  assert.throws(
    () =>
      validateDirectionEvidence(
        {
          ...direction,
          differentiation: {
            ...direction.differentiation,
            evidenceIds: ["C9"],
          },
        },
        research.evidence,
      ),
    /unknown evidence/,
  );
});

test("direction schema rejects invalid colors and unapproved fonts", () => {
  assert.equal(directionSchema.safeParse(direction).success, true);
  assert.equal(
    directionSchema.safeParse({
      ...direction,
      palette: { ...direction.palette, accent: "red" },
    }).success,
    false,
  );
  assert.equal(
    directionSchema.safeParse({
      ...direction,
      typography: { ...direction.typography, display: "Mystery Font" },
    }).success,
    false,
  );
});

test("renderer makes a legible 1920x1080 PNG and rejects invalid artwork", async () => {
  const artwork = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: "#9B8F7B" },
  })
    .png()
    .toBuffer();
  const board = await renderBrandBoard("Context.dev", direction, artwork);
  const metadata = await sharp(board).metadata();
  if (process.env.BRAND_BOARD_PREVIEW_PATH) {
    await writeFile(process.env.BRAND_BOARD_PREVIEW_PATH, board);
  }
  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, BOARD_WIDTH);
  assert.equal(metadata.height, BOARD_HEIGHT);
  assert.ok(
    contrastRatio(direction.palette.background, direction.palette.foreground) >=
      4.5,
  );
  assert.deepEqual(wrapText("One short phrase", 12, 2), [
    "One short",
    "phrase",
  ]);
  assert.ok(wrapText("Supercalifragilistic", 10, 1)[0].length <= 10);
  await assert.rejects(
    renderBrandBoard("Context.dev", direction, Buffer.from("not an image")),
  );
  await assert.rejects(
    renderBrandBoard(
      "Context.dev",
      {
        ...direction,
        palette: { ...direction.palette, foreground: "#EEEEEE" },
      },
      artwork,
    ),
    /insufficient/,
  );
});
