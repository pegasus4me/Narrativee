import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { generateBrandBoard } from "../src/brand-board/run";
import {
  loadBoardResearch,
  type BoardResearch,
} from "../src/brand-board/research";
import type {
  BoardCritique,
  BrandDirection,
} from "../src/brand-board/board.schema";

interface Options {
  url: string;
  outputRoot: string;
}

function parseOptions(args: string[]): Options {
  const options: Options = {
    url: "https://www.trylark.ai/",
    outputRoot: path.resolve(process.cwd(), "output/brand-board"),
  };
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--url" && args[index + 1]) {
      options.url = args[++index];
    } else if (option === "--out" && args[index + 1]) {
      options.outputRoot = path.resolve(args[++index]);
    } else if (option === "--help") {
      console.log(
        "Usage: pnpm board:generate [--url https://www.trylark.ai/] [--out output/brand-board]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete option: ${option}`);
    }
  }
  const url = new URL(options.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("--url must be an HTTP(S) website URL");
  }
  return options;
}

function critiqueMarkdown(
  research: BoardResearch,
  direction: BrandDirection,
  critique: BoardCritique,
  artworkReason: string,
): string {
  const evidenceIds = new Set([
    ...direction.rationale.evidenceIds,
    ...direction.differentiation.evidenceIds,
  ]);
  const references = research.evidence.filter((item) =>
    evidenceIds.has(item.id),
  );
  return [
    `# ${research.brandName} — ${direction.name}`,
    "",
    `Source analysis: ${research.analysisId} (${research.url})`,
    `Artwork choice: ${artworkReason}`,
    "",
    "## Review",
    "",
    `Brand fit: ${critique.brandFit}/5 · Distinctiveness: ${critique.distinctiveness}/5 · Legibility: ${critique.legibility}/5`,
    "",
    critique.verdict,
    "",
    "Strengths:",
    ...critique.strengths.map((item) => `- ${item}`),
    "",
    "Issues:",
    ...critique.issues.map((item) => `- ${item}`),
    "",
    "## Research cited in the direction",
    "",
    ...references.map(
      (item) => `- ${item.id}: ${item.statement} — ${item.sourceUrl}`,
    ),
    "",
    "Review these references and the board before treating any claim as approved brand copy.",
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  console.log(`Loading completed research for ${options.url}…`);
  const research = await loadBoardResearch(options.url);
  const { board, direction, artwork, critique } = await generateBrandBoard(
    research,
    (stage) => console.log(`${stage}…`),
  );

  const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const outputDir = path.join(options.outputRoot, runId);
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, "board.png"), board),
    writeFile(path.join(outputDir, "artwork.png"), artwork.png),
    writeFile(
      path.join(outputDir, "direction.json"),
      JSON.stringify(
        {
          ...direction,
          sourceAnalysisId: research.analysisId,
          sourceUrl: research.url,
          citedEvidence: research.evidence.filter((item) =>
            [
              ...direction.rationale.evidenceIds,
              ...direction.differentiation.evidenceIds,
            ].includes(item.id),
          ),
          artworkSelection: {
            selectedIndex: artwork.selectedIndex,
            candidates: artwork.candidates,
            reason: artwork.reason,
          },
        },
        null,
        2,
      ),
    ),
    writeFile(
      path.join(outputDir, "critique.md"),
      critiqueMarkdown(research, direction, critique, artwork.reason),
    ),
  ]);
  console.log(`Board: ${path.join(outputDir, "board.png")}`);
  console.log(`Direction: ${path.join(outputDir, "direction.json")}`);
  console.log(`Critique: ${path.join(outputDir, "critique.md")}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
