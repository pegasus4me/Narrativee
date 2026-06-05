export interface Channel {
  id: string;
  platform: string;
  accountName: string;
  avatarUrl?: string;
  isConnected?: boolean;
  createdAt: string;
}

export interface Source {
  id: string;
  platform: string;
  url: string;
  articleCount?: number;
  lastSyncedAt?: string;
  avatarUrl?: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  url: string | null;
  publishedAt: string | null;
  sourceId: string | null;
  createdAt: string;
  angleCount: number;
  anglesExtractedAt: string | null;
  draftCount?: number;
  sourcePlatform?: string | null;
}

export interface Draft {
  id: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  channel: {
    platform: string;
    accountName: string;
    avatarUrl?: string;
    isConnected?: boolean;
  };
  content: {
    text?: string;
  };
  articleId?: string;
  articleTitle?: string;
}

export interface KnowledgeBase {
  customHooks: HookItem[];
  customTemplates: TemplateItem[];
  bannedWords: string[];
  brandVoiceTraining: string;
  voiceMemory: VoiceMemory;
}

export interface HookItem {
  channel: string;
  hook: string;
}

export interface TemplateItem {
  channel: string;
  template: string;
}

export interface VoiceMemory {
  sources: VoiceSourceItem[];
  profile: VoiceProfile;
  strictness: number;
  status: VoiceMemoryStatus;
  lastLearnedAt: string | null;
  lastLearnedSourceId: string | null;
}

export type VoiceMemoryStatus = "idle" | "learning" | "ready" | "failed";

export interface VoiceSourceItem {
  category: "newsletter" | "x" | "linkedin" | "website" | "best-performing";
  label: string;
  content: string;
  url: string;
}

export interface VoiceProfile {
  tone: string;
  vocabulary: string;
  sentenceLength: string;
  humorLevel: string;
  opinionatedVsNeutral: string;
  ctaStyle: string;
  topicsToAvoid: string;
  frequentPhrases: string;
}

/** Persisted draft generated for a specific social channel. */
export interface CreationDraft {
  channelId: string;
  platform: string;
  accountName: string | null;
  variantNumber: number;
  angle: string;
  text: string;
}

/** Validation result for a specific platform from the publishing agent. */
export interface PlatformValidation {
  platform: string;
  isValid: boolean;
  warnings: string[];
}

/** Orchestration provenance metadata returned by the multi-agent pipeline. */
export interface OrchestrationMetadata {
  agentsUsed: string[];
  workflowSteps: Array<{ id: string; taskType: string; description: string }>;
  ragContextUsed: Array<{ content: string; source: string; score: number }>;
  memoriesUsed: Array<{ content: string; type: string }>;
  validationResults: PlatformValidation[];
  strategy: {
    summary: string;
    selectedAngles: string[];
    platformDirection: Record<string, string>;
  };
  warnings: string[];
}

/** Saved creation workflow result that can be reopened later. */
export interface CreationSession {
  id: string;
  source: {
    id: string | null;
    platform: string | null;
    url: string | null;
  } | null;
  article: {
    id: string;
    title: string;
    url: string | null;
    publishedAt: string | null;
  } | null;
  selectedAngles: string[];
  selectedChannels: Array<{
    id: string;
    platform: string;
    accountName: string;
    avatarUrl: string | null;
  }>;
  draftCountPerChannel: number;
  drafts: CreationDraft[];
  metadata: OrchestrationMetadata | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Summary card for the create library index. */
export interface CreationSessionSummary {
  id: string;
  articleTitle: string;
  articleUrl: string | null;
  sourceUrl: string | null;
  draftCount: number;
  draftCountPerChannel: number;
  createdAt: string;
  updatedAt: string;
}
