import type {
  CampaignPlan,
  LegacyCampaignPlan,
  CampaignGeneration,
} from "./campaign/campaign.types";
import type { CampaignOutput } from "./campaign/campaign.output";
import type { IdentityPlan } from "./identity.types";

export type VisualApproval = {
  brief: string;
  contextHash: string;
  canvasRevision: number;
  canvasHash?: string;
} & (
  | {
      kind: "campaign_creation";
      plan: CampaignPlan | LegacyCampaignPlan;
      outputs?: CampaignOutput[];
      generation?: CampaignGeneration;
    }
  | { kind: "logo_exploration"; plan: IdentityPlan }
);
export type ApprovalStatus =
  | "pending"
  | "executing"
  | "completed"
  | "rejected"
  | "failed";
