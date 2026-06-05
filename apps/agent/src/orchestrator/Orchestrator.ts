import type { Agent, AgentRequest, AgentResponse } from "../agents/base/types.js";
import type { GeneratedContentAsset, JsonObject, JsonValue } from "../common/types.js";
import { OrchestratorError } from "../errors/OrchestratorError.js";
import type { Logger } from "../logging/Logger.js";
import type { PublishingPlan } from "../agents/publishing-scheduling/types.js";
import type {
  Orchestrator as OrchestratorContract,
  OrchestratorDependencies,
  OrchestratorRequest,
  OrchestratorResponse,
  WorkflowStep
} from "./types.js";

export class CreatorWorkflowOrchestrator implements OrchestratorContract {
  private readonly agentsByTask = new Map<string, Agent>();

  constructor(
    private readonly dependencies: OrchestratorDependencies,
    private readonly logger: Logger
  ) {
    for (const agent of dependencies.agents) {
      for (const taskType of agent.supportedTaskTypes) {
        this.agentsByTask.set(taskType, agent);
      }
    }
  }

  async handle(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    this.logger.info("Orchestrator received request", { requestId: request.id });

    try {
      const classification = await this.dependencies.taskClassifier.classify(request);
      const selectedWorkflow = await this.dependencies.workflowPlanner.plan(request, classification);
      const agentResponses: AgentResponse[] = [];
      const warnings: string[] = [];
      const errors: string[] = [];
      let generatedAssets: readonly GeneratedContentAsset[] = [];

      for (const step of selectedWorkflow.steps) {
        const agent = this.resolveAgent(step);
        const response = await agent.execute(this.createAgentRequest(request, step, generatedAssets));
        agentResponses.push(response);
        warnings.push(...response.warnings);

        if (response.generatedAssets.length > 0) {
          generatedAssets = response.generatedAssets;
        }

        const outputAssets = getOutputAssets(response.output);
        if (outputAssets.length > 0) {
          generatedAssets = outputAssets;
        }
      }

      return aggregateResponse(request.id, selectedWorkflow, agentResponses, warnings, errors);
    } catch (error) {
      this.logger.error("Orchestrator failed", { requestId: request.id });
      if (error instanceof OrchestratorError) {
        throw error;
      }
      throw new OrchestratorError("Workflow orchestration failed.", { requestId: request.id }, error);
    }
  }

  private resolveAgent(step: WorkflowStep): Agent {
    const agent = this.agentsByTask.get(step.taskType);
    if (!agent) {
      throw new OrchestratorError(`No agent registered for ${step.taskType}.`, { taskType: step.taskType });
    }
    return agent;
  }

  private createAgentRequest(
    request: OrchestratorRequest,
    step: WorkflowStep,
    generatedAssets: readonly GeneratedContentAsset[]
  ): AgentRequest {
    return {
      id: `${request.id}_${step.id}`,
      taskType: step.taskType,
      userId: request.userId,
      creatorId: request.creatorId,
      prompt: request.prompt,
      sourceContent: request.sourceContent,
      preferredPlatforms: request.preferredPlatforms,
      requestedOutputs: request.requestedOutputs,
      metadata: request.metadata,
      input: createStepInput(generatedAssets, request.dateRange as JsonObject | undefined)
    };
  }
}

const aggregateResponse = (
  requestId: string,
  selectedWorkflow: OrchestratorResponse["selectedWorkflow"],
  agentResponses: readonly AgentResponse[],
  warnings: readonly string[],
  errors: readonly string[]
): OrchestratorResponse => {
  const publishingOutputs = agentResponses
    .map((response) => response.output)
    .filter(isPublishingPlan);

  return {
    requestId,
    selectedWorkflow,
    agentsUsed: agentResponses.map((response) => response.agentName),
    agentResponses,
    ragContextUsed: agentResponses.flatMap((response) => response.ragContext),
    memoriesUsed: agentResponses.flatMap((response) => response.memories),
    generatedContentAssets: agentResponses.flatMap((response) => response.generatedAssets),
    platformFormattingResults: publishingOutputs.flatMap((output) => output.formattingResults),
    validationResults: publishingOutputs.flatMap((output) => output.validationResults),
    schedulingPayloads: publishingOutputs.flatMap((output) => output.schedulingPayloads),
    suggestedSchedule: publishingOutputs.flatMap((output) => output.schedule),
    warnings: [...new Set(warnings)],
    errors
  };
};

const getOutputAssets = (output: unknown): readonly GeneratedContentAsset[] => {
  if (typeof output !== "object" || output === null || !("assets" in output)) {
    return [];
  }

  const assets = (output as { readonly assets?: unknown }).assets;
  return Array.isArray(assets) ? (assets as GeneratedContentAsset[]) : [];
};

const createStepInput = (
  generatedAssets: readonly GeneratedContentAsset[],
  dateRange?: JsonObject
): JsonObject => ({
  previousAssets: generatedAssets as unknown as JsonValue,
  assets: generatedAssets as unknown as JsonValue,
  ...(dateRange ? { dateRange } : {})
});

const isPublishingPlan = (value: unknown): value is PublishingPlan & JsonValue => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "formattingResults" in value && "validationResults" in value && "schedule" in value;
};
