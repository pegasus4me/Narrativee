import { randomUUID } from "node:crypto";
import { loadBoardResearchForBrand } from "../brand-board/research";
import {
  classifyCreatorIntent,
  createIdentityPlan,
  createLogoScene,
} from "./identity.generator";
import {
  generateStudioReplyStream,
  saveStudioExchange,
  sendStudioMessage,
} from "./studio.service";
import type { LogoScene } from "./identity.schema";

export type CreatorEvent =
  | { type: "stage"; text: string }
  | {
      type: "direction_start";
      runId: string;
      index: number;
      name: string;
      angle: string;
      brandName: string;
    }
  | {
      type: "direction_style";
      runId: string;
      index: number;
      style: Omit<LogoScene, "paths">;
    }
  | {
      type: "direction_path";
      runId: string;
      index: number;
      pathIndex: number;
      path: LogoScene["paths"][number];
    }
  | { type: "direction_complete"; runId: string; index: number }
  | { type: "delta"; text: string };

const activeProjects = new Set<string>();

export class CreatorBusyError extends Error {}

export async function runCreatorRequest(
  projectId: string,
  brandId: string,
  userId: string,
  content: string,
  emit: (event: CreatorEvent) => void,
) {
  emit({ type: "stage", text: "Understanding your request" });
  const intent = await classifyCreatorIntent(content);
  if (intent === "conversation") {
    return sendStudioMessage(projectId, userId, content, (system, turns) =>
      generateStudioReplyStream(system, turns, (delta) => {
        emit({ type: "delta", text: delta });
      }),
    );
  }

  if (activeProjects.has(projectId)) {
    throw new CreatorBusyError("A logo exploration is already running");
  }
  activeProjects.add(projectId);
  try {
    emit({ type: "stage", text: "Reading brand and competitor research" });
    const research = await loadBoardResearchForBrand(brandId);
    const runId = randomUUID();
    emit({ type: "stage", text: "Developing three identity concepts" });
    const plan = await createIdentityPlan(research, content);

    for (const [index, direction] of plan.directions.entries()) {
      emit({
        type: "direction_start",
        runId,
        index,
        name: direction.name,
        angle: direction.strategicAngle,
        brandName: research.brandName,
      });
      emit({
        type: "stage",
        text: `Designing ${direction.name} (${index + 1}/3)`,
      });
      const scene = await createLogoScene(research, plan, index);
      const { paths, ...style } = scene;
      emit({ type: "direction_style", runId, index, style });
      for (const [pathIndex, path] of paths.entries()) {
        emit({ type: "direction_path", runId, index, pathIndex, path });
      }
      emit({ type: "direction_complete", runId, index });
    }

    const answer = `I placed three editable logo directions for ${research.brandName} on the canvas: ${plan.directions.map((item) => item.name).join(", ")}. Zoom in, move the objects, and edit the wordmarks or colors to explore them.`;
    return saveStudioExchange(projectId, content, answer);
  } finally {
    activeProjects.delete(projectId);
  }
}
