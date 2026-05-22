import type { Channel, Source, ArticleListItem, Draft, KnowledgeBase } from "@/app/types/api";

const SARAH_AVATAR = "https://images.squarespace-cdn.com/content/v1/687a750f2d0df239a6910948/df95c93a-1179-4c69-98f8-061719c5634b/Sarah+Chen.jpg";

export const MOCK_CHANNELS: Channel[] = [
  { id: "mock-channel-1", platform: "linkedin", accountName: "Sarah Chen (Founder)", avatarUrl: SARAH_AVATAR, createdAt: new Date().toISOString() },
  { id: "mock-channel-2", platform: "x", accountName: "sarah_growth", avatarUrl: SARAH_AVATAR, createdAt: new Date().toISOString() },
  { id: "mock-channel-3", platform: "threads", accountName: "sarah_chen", avatarUrl: SARAH_AVATAR, createdAt: new Date().toISOString() },
  { id: "mock-channel-4", platform: "instagram", accountName: "sarah_insta", avatarUrl: SARAH_AVATAR, createdAt: new Date().toISOString() },
];

export const MOCK_CHANNELS_SIDEBAR = MOCK_CHANNELS;

export const MOCK_SOURCES: Source[] = [
  { id: "mock-source-1", platform: "substack", url: "https://creators.substack.com/feed", articleCount: 12, lastSyncedAt: new Date().toISOString() },
];

export const MOCK_SOURCES_SIDEBAR = [
  { id: "mock-source-1", url: "https://creators.substack.com/feed", avatarUrl: undefined as string | undefined },
];

export const MOCK_ARTICLE: ArticleListItem = {
  id: "mock-a1",
  title: "Growth Secrets: How we hit 10,000 subscribers in 6 months",
  url: "https://creators.substack.com/p/growth-secrets",
  publishedAt: new Date().toISOString(),
  sourceId: "mock-s1",
  createdAt: new Date().toISOString(),
  angleCount: 3,
  anglesExtractedAt: null,
  draftCount: 0,
  sourcePlatform: "substack",
};



export const MOCK_DRAFTS: Draft[] = [
  {
    id: "mock-d1",
    status: "draft",
    channel: { platform: "linkedin", accountName: "Sarah Chen (Founder)", avatarUrl: SARAH_AVATAR },
    content: {
      text: "Most creators think newsletter growth requires a viral hit.\n\nAfter hitting 10,000 subscribers in 6 months, I can tell you: consistency beats virality.\n\nWe published every Tuesday at 9 AM without fail. Our open rate stayed at 48%.\n\n\u26A1 The playbook is simple:\n\u2022 Pick a schedule and stick to it\n\u2022 Never post raw links - translate them to native value posts\n\u2022 Build a high-value lead magnet\n\nWhat's your newsletter publication schedule?",
    },
  },
  {
    id: "mock-d2",
    status: "draft",
    channel: { platform: "x", accountName: "sarah_growth", avatarUrl: SARAH_AVATAR },
    content: {
      text: "We hit 10k newsletter subscribers in 6 months.\n\nNo paid ads. No massive budget.\n\nJust 3 simple rules:\n1/ Consistency beats virality (published every Tuesday 9 AM)\n2/ Used high-value playbooks as lead magnets (40% of signups)\n3/ Shared platform-native hooks instead of raw links\n\nRead the full blueprint here \uD83D\uDC47",
    },
  },
  {
    id: "mock-d3",
    status: "draft",
    channel: { platform: "threads", accountName: "sarah_chen", avatarUrl: SARAH_AVATAR },
    content: {
      text: "Consistency beats virality every single time.\n\nWe published every Tuesday at 9 AM without fail. Our open rate stayed at 48%.\n\n\u26A1 The playbook is simple:\n\u2022 Pick a schedule and stick to it\n\u2022 Never post raw links - translate them to native value posts\n\u2022 Build a high-value lead magnet\n\nWhat's your newsletter publication schedule?",
    },
  },
  {
    id: "mock-d4",
    status: "draft",
    channel: { platform: "instagram", accountName: "sarah_insta", avatarUrl: SARAH_AVATAR },
    content: {
      text: "We hit 10,000 subscribers in 6 months. How? We published every Tuesday at 9 AM without fail. Consistency is the magic formula. \u2728\n\nWhat's your posting rhythm?",
    },
  },
];

export const MOCK_HOOKS = [
  { channel: "linkedin", hook: "I spent 30 hours analyzing why some newsletters go viral. Here is the formula:" },
  { channel: "x", hook: "90% of content repurposing is waste. Here is how to do it natively in 3 steps:" },
  { channel: "threads", hook: "The best newsletter creators don't rewrite. They translate. Here is how:" },
];

export const MOCK_TEMPLATES = [
  {
    channel: "linkedin",
    template: "\uD83D\uDE80 [Viral Hook Line]\n\nHere is the breakdown:\n\u2022 [Key Insight 1]\n\u2022 [Key Insight 2]\n\n\uD83D\uDCA1 Actionable Takeaway: [Practical Blueprint]\n\nFollow me for more daily content guides.",
  },
];

export const MOCK_BANNED_WORDS = ["delve", "synergy", "testament", "tapestry"];

export const MOCK_BRAND_VOICE = "Write in crisp, punchy, actionable sentences.\nUse bullet points and double line breaks for high scannability.\nAvoid AI buzzwords like 'delve' or 'revolutionize'.\nEmulate a transparent, practitioner-first builder voice.";

export const MOCK_KNOWLEDGE_BASE: KnowledgeBase = {
  customHooks: MOCK_HOOKS,
  customTemplates: MOCK_TEMPLATES,
  bannedWords: MOCK_BANNED_WORDS,
  brandVoiceTraining: MOCK_BRAND_VOICE,
};
