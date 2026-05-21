export interface Channel {
  id: string;
  platform: string;
  accountName: string;
  avatarUrl?: string;
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
}

export interface HookItem {
  channel: string;
  hook: string;
}

export interface TemplateItem {
  channel: string;
  template: string;
}
