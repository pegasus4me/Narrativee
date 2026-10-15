import { billable } from "../usage/operations";
import {
  collaborateWithAgents,
  type VisualTask,
  type AgentRespond,
} from "./agent-collaboration";
import {
  agentActivity,
  type CreativeAgentSelection,
  type StudioAgentAnswer,
} from "./agent-team";
import { readAgentSettings } from "./agent-settings.service";
import {
  loadStudioConversation,
  saveStudioExchange,
  type StudioReply,
} from "./studio.service";
import type { CreatorEvent } from "./creator.service";
import { mentionedAgents } from "./agent-mentions";
import type { CampaignOutput } from "./campaign/campaign.output";
import type { CampaignGeneration } from "./campaign/campaign.types";
import { loadCampaignContext } from "./campaign/campaign.context";
import { buildConversationMaterials } from "./conversation-materials";

async function runCollaborativeConversationInternal(
  projectId: string,
  userId: string,
  content: string,
  emit: (event: CreatorEvent) => void,
  selectedAgent: CreativeAgentSelection = "team",
  prepareVisual?: (task: VisualTask) => Promise<StudioAgentAnswer>,
  generate?: StudioReply,
  outputs?: CampaignOutput[],
  generation?: CampaignGeneration,
) {
  const materials = generation
    ? buildConversationMaterials(
        await loadCampaignContext(projectId, userId, selectedAgent, generation),
        generation,
      )
    : undefined;
  const conversation = await loadStudioConversation(
    projectId,
    userId,
    content,
    selectedAgent,
    materials,
  );
  if (!conversation) return null;
  const agent =
    selectedAgent === "team"
      ? (mentionedAgents(content)[0] ?? "brand")
      : selectedAgent;
  const respond: AgentRespond | undefined = generate
    ? async (request) => {
        const turns = request.input.flatMap((item) =>
          "role" in item &&
          (item.role === "user" || item.role === "assistant") &&
          "content" in item &&
          typeof item.content === "string"
            ? [{ role: item.role, content: item.content }]
            : [],
        );
        const text = await generate(request.system, turns, {
          model: request.model,
          attachments: request.input.filter(
            (item) =>
              "role" in item &&
              item.role === "user" &&
              "content" in item &&
              Array.isArray(item.content),
          ),
        });
        request.onDelta?.(text);
        return { output: [], text };
      }
    : undefined;
  emit(
    agentActivity(
      agent,
      "working",
      "Reading your brief and the team's shared context",
    ),
  );
  const result = await collaborateWithAgents({
    agent,
    system:
      conversation.system +
      (outputs
        ? `\nSelected campaign outputs: ${JSON.stringify(outputs)}. When preparing a campaign proposal, preserve every selected platform and size. These selections are not approval to create or publish.`
        : ""),
    turns: conversation.turns,
    attachments: conversation.attachments,
    settings: (target) =>
      readAgentSettings(conversation.project.brandId, target),
    emit,
    prepareVisual,
    respond,
  });
  emit(agentActivity(agent, "complete", "Ready for your feedback"));
  return saveStudioExchange(
    projectId,
    content,
    result.content,
    agent,
    result.contributions.length ? "team" : selectedAgent,
    result.contributions,
  );
}

export async function runCollaborativeConversation(
  projectId: string,
  userId: string,
  content: string,
  emit: (event: CreatorEvent) => void,
  selectedAgent: CreativeAgentSelection = "team",
  prepareVisual?: (task: VisualTask) => Promise<StudioAgentAnswer>,
  generate?: StudioReply,
  outputs?: CampaignOutput[],
  generation?: CampaignGeneration,
) {
  return billable(userId, "conversation", () =>
    runCollaborativeConversationInternal(
      projectId,
      userId,
      content,
      emit,
      selectedAgent,
      prepareVisual,
      generate,
      outputs,
      generation,
    ),
  );
}
