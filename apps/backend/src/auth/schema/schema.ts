import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  plan: text("plan").notNull().default("free"),
  tokens: integer("tokens").default(40),
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  subscriptionStatus: text("subscriptionStatus"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  onboarded: boolean("onboarded").default(false),
  substackHandle: text("substackHandle"),
  // User Preferences
  language: text("language"),
  writingStyle: text("writingStyle"),
  contentTopics: jsonb("contentTopics"), // Array of strings
  // Legacy fields (kept to avoid data loss warning during push)
  orgName: text("orgName"),
  orgUrl: text("orgUrl"),
  orgLogo: text("orgLogo"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(), // Must be text for better-auth to parse correctly
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── Content Pipeline Architecture ──────────────────────────────────────────

export const contentSources = pgTable("content_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // 'substack', 'beehiiv', 'custom_rss'
  url: text("url"), // e.g., https://myblog.substack.com/feed
  avatarUrl: text("avatar_url"),
  apiKey: text("api_key"), // For Beehiiv API
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channels = pgTable("channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // 'x', 'linkedin', 'threads', 'instagram'
  providerAccountId: text("provider_account_id").notNull(), // ID from the social network
  accountName: text("account_name"), // e.g., "@narrativee"
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  isConnected: boolean("is_connected").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").references(() => contentSources.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(), // Full HTML or Markdown
  url: text("url"),
  publishedAt: timestamp("published_at"),
  /** Cached atomic ideas / angles from last extraction (string[]) */
  extractedAngles: jsonb("extracted_angles"),
  anglesExtractedAt: timestamp("angles_extracted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  articleId: uuid("article_id").references(() => articles.id, { onDelete: "set null" }),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(), // Store text, media URLs, thread arrays, etc.
  status: text("status").notNull().default("draft"), // 'draft', 'scheduled', 'published', 'failed'
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  externalPostId: text("external_post_id"), // The ID returned by X/LinkedIn after posting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const creationSessions = pgTable("creation_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").references(() => contentSources.id, { onDelete: "set null" }),
  articleId: uuid("article_id").references(() => articles.id, { onDelete: "set null" }),
  selectedAngles: jsonb("selected_angles").notNull().default([]),
  selectedChannelIds: jsonb("selected_channel_ids").notNull().default([]),
  drafts: jsonb("drafts").notNull().default([]),
  /** Orchestration provenance — agents used, strategy, RAG context, validation results. */
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("ready"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  contentSources: many(contentSources),
  channels: many(channels),
  articles: many(articles),
  socialPosts: many(socialPosts),
  creationSessions: many(creationSessions),
  knowledgeBase: one(knowledgeBase),
}));

// DB-backed OAuth CSRF state store (replaces in-memory Map for multi-instance safety)
export const oauthStates = pgTable("oauth_states", {
  state: text("state").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  codeVerifier: text("code_verifier"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  customHooks: jsonb("custom_hooks").notNull().default([]), // { channel: string, hook: string }[]
  customTemplates: jsonb("custom_templates").notNull().default([]), // { channel: string, template: string }[]
  bannedWords: jsonb("banned_words").notNull().default([]), // string[]
  brandVoiceTraining: text("brand_voice_training").default(""),
  voiceMemory: jsonb("voice_memory").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one }) => ({
  user: one(user, { fields: [knowledgeBase.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const contentSourcesRelations = relations(contentSources, ({ one, many }) => ({
  user: one(user, { fields: [contentSources.userId], references: [user.id] }),
  articles: many(articles),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  user: one(user, { fields: [channels.userId], references: [user.id] }),
  socialPosts: many(socialPosts),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  user: one(user, { fields: [articles.userId], references: [user.id] }),
  source: one(contentSources, { fields: [articles.sourceId], references: [contentSources.id] }),
  socialPosts: many(socialPosts),
  creationSessions: many(creationSessions),
}));

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  user: one(user, { fields: [socialPosts.userId], references: [user.id] }),
  article: one(articles, { fields: [socialPosts.articleId], references: [articles.id] }),
  channel: one(channels, { fields: [socialPosts.channelId], references: [channels.id] }),
}));

export const creationSessionsRelations = relations(creationSessions, ({ one }) => ({
  user: one(user, { fields: [creationSessions.userId], references: [user.id] }),
  source: one(contentSources, { fields: [creationSessions.sourceId], references: [contentSources.id] }),
  article: one(articles, { fields: [creationSessions.articleId], references: [articles.id] }),
}));
