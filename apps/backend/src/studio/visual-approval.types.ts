import type {
  CampaignPlan,
  LegacyCampaignPlan,
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
    }
  | { kind: "logo_exploration"; plan: IdentityPlan }
);
export type ApprovalStatus =
  | "pending"
  | "executing"
  | "completed"
  | "rejected"
  | "failed";
