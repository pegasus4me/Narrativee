export type CreativeAgent = "research" | "brand" | "creator";
export type CreativeAgentSelection = "team" | CreativeAgent;

import type { VisualApproval } from "./visual-approval.types";

export type StudioAgentAnswer = {
  agent: CreativeAgent;
  content: string;
  approval?: VisualApproval;
  contributions?: StudioAgentAnswer[];
  needsRevision?: true;
};
export type TeamChatEvent =
  | { type: "conversation_thread"; thread: "team" }
  | { type: "team_message"; agent: CreativeAgent; content: string };

export function createTeamDiscussion(emit: (event: TeamChatEvent) => void) {
  const contributions: StudioAgentAnswer[] = [];
  emit({ type: "conversation_thread", thread: "team" });
  return {
    contributions,
    say(agent: CreativeAgent, content: string) {
      contributions.push({ agent, content });
      emit({ type: "team_message", agent, content });
    },
  };
}
export const agentNames = {
  research: "Scout",
  brand: "Sage",
  creator: "Pixel",
};

const agentFocus = {
  research:
    "You are Scout, the research agent. Focus on brand and competitor evidence, positioning, and creative angles. Use the supplied research; do not claim to run a new scan or know which ads convert. If evidence is missing, explain what is needed.",
  brand:
    "You are Sage, the brand and direction agent. Focus on approved Brand Brain rules, consistency, brand fit, and critique of the existing creative. Distinguish approved rules from proposed changes.",
  creator:
    "You are Pixel, the creative agent. Explain and refine creative ideas using the actual saved canvas context and brand rules.",
} satisfies Record<CreativeAgent, string>;

export function focusAgentPrompt(
  system: string,
  agent?: CreativeAgentSelection,
) {
  if (!agent || agent === "team") return system;
  return `${system}\n\n<selected_agent>\n${agentFocus[agent]}\nAnswer the user's request in this role. Consult teammates through the available tools when their expertise is needed. Claim execution only when an executed tool confirms it; otherwise answer conversationally. Keep the existing evidence boundaries.\n</selected_agent>`;
}

export type AgentActivityEvent = {
  type: "agent_activity";
  agent: CreativeAgent;
  status: "working" | "complete" | "error";
  text: string;
};

export function agentActivity(
  agent: CreativeAgent,
  status: AgentActivityEvent["status"],
  text: string,
): AgentActivityEvent {
  return { type: "agent_activity", agent, status, text };
}
