import type {
  DateRange,
  GeneratedContentAsset,
  JsonObject,
  PlatformName,
  ScheduleItem
} from "../common/types.js";
import type { Agent, AgentResponse, AgentTaskType } from "../agents/base/types.js";
import type { PlatformFormattingResult, PlatformValidationResult, SchedulingPayload } from "../platforms/base/types.js";
import type { MemoryResult } from "../memory/types.js";
import type { RagResult } from "../rag/types.js";

export type OrchestratorRequest = {
  readonly id: string;
  readonly userId?: string;
  readonly creatorId: string;
  readonly prompt: string;
  readonly sourceContent?: string;
  readonly preferredPlatforms?: readonly PlatformName[];
  readonly requestedOutputs?: JsonObject;
  readonly dateRange?: DateRange;
  readonly metadata?: JsonObject;
};

export type WorkflowStep = {
  readonly id: string;
  readonly taskType: AgentTaskType;
  readonly dependsOn?: readonly string[];
};

export type WorkflowPlan = {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly WorkflowStep[];
  readonly reason: string;
};

export type ClassificationResult = {
  readonly primaryTaskType: AgentTaskType;
  readonly requestedTaskTypes: readonly AgentTaskType[];
  readonly platforms: readonly PlatformName[];
  readonly requiresScheduling: boolean;
};

export type OrchestratorResponse = {
  readonly requestId: string;
  readonly selectedWorkflow: WorkflowPlan;
  readonly agentsUsed: readonly string[];
  readonly agentResponses: readonly AgentResponse[];
  readonly ragContextUsed: readonly RagResult[];
  readonly memoriesUsed: readonly MemoryResult[];
  readonly generatedContentAssets: readonly GeneratedContentAsset[];
  readonly platformFormattingResults: readonly PlatformFormattingResult[];
  readonly validationResults: readonly PlatformValidationResult[];
  readonly schedulingPayloads: readonly SchedulingPayload[];
  readonly suggestedSchedule: readonly ScheduleItem[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
};

export interface Orchestrator {
  handle(request: OrchestratorRequest): Promise<OrchestratorResponse>;
}

export type OrchestratorDependencies = {
  readonly agents: readonly Agent[];
  readonly taskClassifier: TaskClassifier;
  readonly workflowPlanner: WorkflowPlanner;
};

export interface TaskClassifier {
  classify(request: OrchestratorRequest): Promise<ClassificationResult>;
}

export interface WorkflowPlanner {
  plan(request: OrchestratorRequest, classification: ClassificationResult): Promise<WorkflowPlan>;
}
