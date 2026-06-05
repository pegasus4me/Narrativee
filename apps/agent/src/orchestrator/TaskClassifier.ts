import type { AgentTaskType } from "../agents/base/types.js";
import type { PlatformName } from "../common/types.js";
import type { ClassificationResult, OrchestratorRequest, TaskClassifier } from "./types.js";

export class SimpleTaskClassifier implements TaskClassifier {
  async classify(request: OrchestratorRequest): Promise<ClassificationResult> {
    const text = request.prompt.toLowerCase();
    const requestedTaskTypes = new Set<AgentTaskType>();

    if (containsAny(text, ["strategy", "pillar", "positioning", "campaign", "launch"])) {
      requestedTaskTypes.add("content_strategy");
    }

    if (containsAny(text, ["turn", "repurpose", "convert", "transcript", "hooks", "posts", "scripts"])) {
      requestedTaskTypes.add("content_repurposing");
    }

    if (containsAny(text, ["schedule", "publishing", "calendar", "next week", "when", "cadence"])) {
      requestedTaskTypes.add("publishing_scheduling");
    }

    if (requestedTaskTypes.size === 0) {
      requestedTaskTypes.add("content_strategy");
    }

    const platforms = request.preferredPlatforms?.length ? request.preferredPlatforms : inferPlatforms(text);

    const taskTypes = [...requestedTaskTypes];

    return {
      primaryTaskType: taskTypes[0] ?? "content_strategy",
      requestedTaskTypes: taskTypes,
      platforms,
      requiresScheduling: requestedTaskTypes.has("publishing_scheduling")
    };
  }
}

const containsAny = (text: string, terms: readonly string[]): boolean => terms.some((term) => text.includes(term));

const inferPlatforms = (text: string): readonly PlatformName[] => {
  const platforms: PlatformName[] = [];
  if (text.includes("x ") || text.includes(" x") || text.includes("twitter")) platforms.push("x");
  if (text.includes("linkedin")) platforms.push("linkedin");
  if (text.includes("tiktok")) platforms.push("tiktok");
  if (text.includes("instagram")) platforms.push("instagram");
  if (text.includes("youtube")) platforms.push("youtube");
  if (text.includes("newsletter")) platforms.push("newsletter");
  return platforms.length > 0 ? platforms : ["x", "linkedin"];
};
