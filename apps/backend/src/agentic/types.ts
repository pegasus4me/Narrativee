import type {
  CarouselSlideRole,
  CarouselSpec,
  CarouselTargetPlatform,
} from "creator-agent-orchestrator";

/** Rendered slide artifact returned by the visual rendering provider. */
export interface CarouselRenderSlide {
  imageUrl: string;
  role: CarouselSlideRole;
  providerAssetId: string | null;
  templateId: string | null;
}

/** Render metadata for a successfully rendered carousel. */
export interface CarouselRenderResult {
  provider: "placid";
  renderedAt: string;
  slides: CarouselRenderSlide[];
}

/** Lifecycle state for the optional carousel visuals attached to a draft. */
export type CarouselRenderStatus = "not_requested" | "rendered" | "failed";

/** Optional carousel payload nested on a saved creation draft. */
export interface CreationDraftCarousel {
  spec: CarouselSpec;
  renderStatus: CarouselRenderStatus;
  render: CarouselRenderResult | null;
  errorMessage: string | null;
}

export interface CreationDraft {
  channelId: string;
  platform: string;
  accountName: string | null;
  variantNumber: number;
  angle: string;
  text: string;
  carousel?: CreationDraftCarousel | null;
}

export interface ChannelInput {
  id: string;
  platform: string;
  accountName: string | null;
}

export interface VoiceMemoryProfile {
  sources: Array<{ category: string; label?: string; content: string; url?: string | null }>;
  profile: Record<string, string>;
  strictness: number;
  status: string;
  lastLearnedAt: string | null;
  lastLearnedSourceId: string | null;
}

export interface KnowledgeContext {
  brandVoiceTraining: string;
  voiceMemory: VoiceMemoryProfile;
  customHooks: Array<{ channel: string; hook: string }>;
  customTemplates: Array<{ channel: string; template: string }>;
  bannedWords: string[];
}

export interface CreationWorkflowInput {
  articleTitle: string;
  articleContent: string;
  sourceArticleSamples: Array<{ title: string; content: string; url: string | null }>;
  selectedAngles: string[];
  channels: ChannelInput[];
  draftCount: number;
  carouselPlatforms?: CarouselTargetPlatform[];
  knowledge: KnowledgeContext;
  userId?: string;
  creatorId?: string;
  userGoals?: string;
}

export interface StrategyPlan {
  summary: string;
  selectedAngles: string[];
  platformDirection: Record<string, string>;
}

/** Validation result returned per platform by the publishing agent. */
export interface PlatformValidation {
  platform: string;
  isValid: boolean;
  warnings: string[];
}

/** Orchestration provenance metadata persisted alongside drafts. */
export interface OrchestrationMetadata {
  agentsUsed: string[];
  workflowSteps: Array<{ id: string; taskType: string; description: string }>;
  ragContextUsed: Array<{ content: string; source: string; score: number }>;
  memoriesUsed: Array<{ content: string; type: string }>;
  validationResults: PlatformValidation[];
  strategy: StrategyPlan;
  warnings: string[];
}

export interface CreationWorkflowResult {
  strategy: StrategyPlan;
  drafts: CreationDraft[];
  metadata: OrchestrationMetadata;
  warnings: string[];
}
