import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { loadBoardResearchForBrand } from "../brand-board/research";
import { generateBrandBoard } from "../brand-board/run";

const outputRoot = path.resolve(process.cwd(), "output/studio-boards");
const artifactNames = ["board.png", "direction.json", "critique.json"] as const;
type ArtifactName = (typeof artifactNames)[number];

const savedBoardSchema = z.object({
  runId: z.string().regex(/^[0-9TZ-]+-[0-9a-f]{8}$/),
  createdAt: z.string(),
  concept: z.string(),
  critique: z.object({
    brandFit: z.number(),
    distinctiveness: z.number(),
    legibility: z.number(),
    strengths: z.array(z.string()),
    issues: z.array(z.string()),
    verdict: z.string(),
  }),
});

type SavedBoard = z.infer<typeof savedBoardSchema>;
type BoardStatus =
  | { status: "idle" }
  | { status: "running"; stage: string }
  | { status: "failed"; error: string }
  | ({ status: "ready" } & SavedBoard);

const activeBoards = new Map<string, BoardStatus>();
const runIdPattern = /^[0-9TZ-]+-[0-9a-f]{8}$/;

function projectFolder(projectId: string): string {
  return path.join(outputRoot, projectId);
}

async function latestBoard(projectId: string): Promise<SavedBoard | null> {
  try {
    const content = await readFile(
      path.join(projectFolder(projectId), "latest.json"),
      "utf8",
    );
    return savedBoardSchema.parse(JSON.parse(content));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getBrandBoardStatus(
  projectId: string,
): Promise<BoardStatus> {
  const active = activeBoards.get(projectId);
  if (active) return active;
  const latest = await latestBoard(projectId);
  return latest ? { status: "ready", ...latest } : { status: "idle" };
}

export async function listBrandBoardRuns(
  projectId: string,
): Promise<SavedBoard[]> {
  let entries;
  try {
    entries = await readdir(projectFolder(projectId), { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const runs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && runIdPattern.test(entry.name))
      .map(async (entry) => {
        try {
          const content = await readFile(
            path.join(projectFolder(projectId), entry.name, "manifest.json"),
            "utf8",
          );
          const saved = savedBoardSchema.parse(JSON.parse(content));
          return saved.runId === entry.name ? saved : null;
        } catch {
          return null;
        }
      }),
  );
  return runs
    .filter((run): run is SavedBoard => Boolean(run))
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export async function startBrandBoardExperiment(
  projectId: string,
  brandId: string,
): Promise<BoardStatus> {
  const running = activeBoards.get(projectId);
  if (running?.status === "running") return running;

  const research = await loadBoardResearchForBrand(brandId);
  if (activeBoards.get(projectId)?.status === "running") {
    return activeBoards.get(projectId)!;
  }

  activeBoards.set(projectId, {
    status: "running",
    stage: "Starting brand exploration",
  });

  void (async () => {
    try {
      const { board, direction, artwork, critique } = await generateBrandBoard(
        research,
        (stage) => {
          activeBoards.set(projectId, { status: "running", stage });
        },
      );
      const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
      const folder = path.join(projectFolder(projectId), runId);
      const saved: SavedBoard = {
        runId,
        createdAt: new Date().toISOString(),
        concept: direction.name,
        critique,
      };
      await mkdir(folder, { recursive: true });
      await Promise.all([
        writeFile(path.join(folder, "board.png"), board),
        writeFile(path.join(folder, "artwork.png"), artwork.png),
        writeFile(
          path.join(folder, "manifest.json"),
          JSON.stringify(saved, null, 2),
        ),
        writeFile(
          path.join(folder, "direction.json"),
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
          path.join(folder, "critique.json"),
          JSON.stringify(critique, null, 2),
        ),
      ]);
      await writeFile(
        path.join(projectFolder(projectId), "latest.json"),
        JSON.stringify(saved, null, 2),
      );
      activeBoards.set(projectId, { status: "ready", ...saved });
    } catch (error) {
      console.error("Studio brand board failed:", error);
      activeBoards.set(projectId, {
        status: "failed",
        error:
          error instanceof Error ? error.message : "Brand generation failed",
      });
    }
  })();

  return activeBoards.get(projectId)!;
}

export async function readBrandBoardArtifact(
  projectId: string,
  name: string,
  requestedRunId?: string,
): Promise<Buffer | null> {
  if (!artifactNames.includes(name as ArtifactName)) return null;
  const run = requestedRunId
    ? (await listBrandBoardRuns(projectId)).find(
        (item) => item.runId === requestedRunId,
      )
    : await latestBoard(projectId);
  if (!run) return null;
  return readFile(path.join(projectFolder(projectId), run.runId, name));
}
