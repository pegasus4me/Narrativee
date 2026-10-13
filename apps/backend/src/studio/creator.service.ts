import { billable } from "../usage/operations";
import { classifyCreatorIntentWithJev } from "./identity.judgment";
import { readStudioTeamContext, saveStudioExchange } from "./studio.service";
import { runCampaignRequest } from "./campaign/campaign.service";
import { runCollaborativeConversation } from "./collaboration.service";
import type { VisualTask } from "./agent-collaboration";
import { mentionedAgents } from "./agent-mentions";
import type { LogoScene } from "./identity.schema";
import type { CampaignDocument } from "./campaign/campaign.schema";
import type { CampaignOutput } from "./campaign/campaign.output";
import type { CampaignGeneration } from "./campaign/campaign.types";
import {
  agentActivity,
  type AgentActivityEvent,
  type CreativeAgentSelection,
  type TeamChatEvent,
} from "./agent-team";

export type CreatorEvent =
  | AgentActivityEvent
  | TeamChatEvent
  | { type: "reply_agent"; agent: AgentActivityEvent["agent"] }
  | { type: "campaign_scene"; document: CampaignDocument }
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

// ponytail: Single-process guard; add a durable lock before scaling backend replicas.
const activeProjects = new Set<string>();
export class CreatorBusyError extends Error {}

async function runCreatorRequestInternal(
  projectId: string,
  brandId: string,
  userId: string,
  content: string,
  emit: (event: CreatorEvent) => void,
  selectedAgent: CreativeAgentSelection = "team",
  outputs?: CampaignOutput[],
  generation?: CampaignGeneration,
) {
  return withCreatorProject(projectId, async () => {
    let currentAgent: AgentActivityEvent["agent"] =
      selectedAgent === "team" ? "brand" : selectedAgent;
    const publish = (event: CreatorEvent) => {
      if (event.type === "agent_activity" && event.status === "working")
        currentAgent = event.agent;
      emit(event);
    };
    const executeVisual = (
      task: VisualTask,
      forward: (event: CreatorEvent) => void,
    ) =>
      runCampaignRequest(
        projectId,
        brandId,
        userId,
        task.brief,
        forward,
        selectedAgent,
        undefined,
        outputs,
      );
    const history = () => readStudioTeamContext(projectId);
    const delegateVisual = async (task: VisualTask) => {
      const intent = await classifyCreatorIntentWithJev(
        content,
        (await history()).slice(-12),
      );
      if (intent === "conversation" || intent !== task.kind)
        throw new Error(
          "The user's request does not authorize this new visual. Continue with discussion or ask for the missing creation brief.",
        );
      return executeVisual(task, (event) => {
        // The addressed agent remains the author of the streamed answer.
        if (event.type !== "delta" && event.type !== "reply_agent")
          publish(event);
      });
    };
    try {
      if (generation) {
        const answer = await runCampaignRequest(
          projectId,
          brandId,
          userId,
          content,
          publish,
          "team",
          undefined,
          outputs,
          generation,
        );
        return saveStudioExchange(
          projectId,
          content,
          answer.content,
          answer.agent,
          "team",
          answer.contributions ?? [],
          answer.approval,
        );
      }
      if (
        selectedAgent === "research" ||
        selectedAgent === "brand" ||
        mentionedAgents(content).length
      )
        return await runCollaborativeConversation(
          projectId,
          userId,
          content,
          publish,
          selectedAgent,
          delegateVisual,
          undefined,
          outputs,
        );
      publish(
        agentActivity(
          "brand",
          "working",
          "Understanding your brief and choosing the next step",
        ),
      );
      emit({ type: "stage", text: "Understanding your request" });
      const intent = await classifyCreatorIntentWithJev(
        content,
        (await history()).slice(-12),
      );
      publish(agentActivity("brand", "complete", "Brief understood"));
      if (intent === "conversation")
        return await runCollaborativeConversation(
          projectId,
          userId,
          content,
          publish,
          selectedAgent,
          delegateVisual,
          undefined,
          outputs,
        );
      const answer = await executeVisual(
        { kind: intent, brief: content },
        publish,
      );
      return await saveStudioExchange(
        projectId,
        content,
        answer.content,
        answer.agent,
        "team",
        answer.contributions ?? [],
        answer.approval,
      );
    } catch (error) {
      publish(
        agentActivity(
          currentAgent,
          "error",
          error instanceof Error ? error.message : "This step could not finish",
        ),
      );
      throw error;
    }
  });
}

export async function withCreatorProject<T>(
  projectId: string,
  run: () => Promise<T>,
) {
  if (activeProjects.has(projectId))
    throw new CreatorBusyError(
      "Your creative team is already working in this project",
    );
  activeProjects.add(projectId);
  try {
    return await run();
  } finally {
    activeProjects.delete(projectId);
  }
}

export async function runCreatorRequest(
  projectId: string,
  brandId: string,
  userId: string,
  content: string,
  emit: (event: CreatorEvent) => void,
  selectedAgent: CreativeAgentSelection = "team",
  outputs?: CampaignOutput[],
  generation?: CampaignGeneration,
) {
  return billable(userId, "creation", () =>
    runCreatorRequestInternal(
      projectId,
      brandId,
      userId,
      content,
      emit,
      selectedAgent,
      outputs,
      generation,
    ),
  );
}
