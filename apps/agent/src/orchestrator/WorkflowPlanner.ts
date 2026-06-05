import type { ClassificationResult, OrchestratorRequest, WorkflowPlan, WorkflowPlanner } from "./types.js";

export class SimpleWorkflowPlanner implements WorkflowPlanner {
  async plan(_request: OrchestratorRequest, classification: ClassificationResult): Promise<WorkflowPlan> {
    const steps = classification.requestedTaskTypes.map((taskType, index) => ({
      id: `step_${index + 1}_${taskType}`,
      taskType,
      dependsOn: index === 0 ? [] : [`step_${index}_${classification.requestedTaskTypes[index - 1]}`]
    }));

    return {
      id: `workflow_${classification.requestedTaskTypes.join("_then_")}`,
      name: nameForWorkflow(classification.requestedTaskTypes),
      steps,
      reason: "Selected by intent classification and ordered so strategy can inform repurposing, then publishing."
    };
  }
}

const nameForWorkflow = (taskTypes: readonly string[]): string => {
  if (taskTypes.length === 1) {
    return taskTypes[0].replaceAll("_", " ");
  }

  return taskTypes.map((taskType) => taskType.replaceAll("_", " ")).join(" -> ");
};
