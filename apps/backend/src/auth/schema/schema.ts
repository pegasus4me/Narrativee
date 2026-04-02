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
  tokens: integer("tokens").default(20),
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  subscriptionStatus: text("subscriptionStatus"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  onboarded: boolean("onboarded").default(false),
  substackPublicationName: text("substackPublicationName"),
  substackPublicationUrl: text("substackPublicationUrl"),
  substackPublicationLogo: text("substackPublicationLogo"),
  substackProfileUrl: text("substackProfileUrl"),
  substackBio: text("substackBio"),
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
  updatedAt: timestamp("updatedAt").notNull(),
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
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(), // Must be text for better-auth to parse correctly
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  substackId: text("substack_id"), // Optional: deduplication ID from Substack
  title: text("title"),
  url: text("url"),
  slug: text("slug"), // e.g. /p/my-post-title
  publishedAt: timestamp("published_at"),

  // Metrics
  views: integer("views").default(0),
  openRate: integer("open_rate").default(0), // Percentage 0-100
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0), // Can sometimes get this from public page

  // Sync Status
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  substackNoteId: text("substack_note_id"),  // deduplication
  contentPreview: text("content_preview"),   // first 280 chars
  url: text("url"),
  publishedAt: timestamp("published_at"),

  // Metrics
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  restacks: integer("restacks").default(0),

  // Sync Status
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // e.g. "2025-01"
  freeCount: integer("free_count").default(0),
  paidCount: integer("paid_count").default(0),
  totalCount: integer("total_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inspirations = pgTable("inspirations", {
  id: text("id").primaryKey(), // Keep the original ID from the extension ('note_xxx')
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorName: text("author_name"),
  authorHandle: text("author_handle"),
  authorAvatar: text("author_avatar"),
  url: text("url"),
  likes: integer("likes").default(0),
  restacks: integer("restacks").default(0),
  comments: integer("comments").default(0),
  tags: jsonb("tags").default([]),            // string[]
  personalNotes: text("personal_notes"),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduledNotes = pgTable("scheduled_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time"),
  scheduledTimestamp: text("scheduled_timestamp"), // UTC ms as string — authoritative fire time
  timezone: text("timezone"),                                             // e.g. "Europe/Paris"
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"), // draft | active | paused | completed
  replyTemplate: text("reply_template").notNull().default(""), // kept for backwards compat
  sequenceSteps: jsonb("sequence_steps").$type<string[]>().notNull().default([]), // ordered list of AI angle hints per step
  dailyQuota: integer("daily_quota").notNull().default(5), // Max replies per day
  repliedToday: integer("replied_today").notNull().default(0),
  totalReplies: integer("total_replies").notNull().default(0),
  lastQuotaResetAt: timestamp("last_quota_reset_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignTargets = pgTable("campaign_targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // The original top-level comment we found our target replying to
  parentCommentId: text("parent_comment_id").notNull(), // Substack comment ID
  parentCommentUrl: text("parent_comment_url").notNull(),
  parentPostUrl: text("parent_post_url").notNull(),
  // The target commenter (2nd-degree)
  targetAuthorName: text("target_author_name"),
  targetAuthorHandle: text("target_author_handle"),
  targetCommentId: text("target_comment_id").notNull(), // Their reply comment ID
  targetCommentUrl: text("target_comment_url"), // Direct permalink to their comment
  targetCommentContent: text("target_comment_content"), // Snippet of their reply
  parentCommentContent: text("parent_comment_content"), // Snippet of the 1st-degree comment they replied to
  originalNoteContent: text("original_note_content"), // The original note being discussed
  // Reply tracking
  status: text("status").notNull().default("pending"), // pending | replied | skipped | failed
  sequenceStep: integer("sequence_step").notNull().default(0), // which step of the campaign sequence has been sent (0 = none)
  repliedAt: timestamp("replied_at"),
  replyCommentId: text("reply_comment_id"), // The ID of our reply comment once posted
  replyText: text("reply_text"), // What our LLM actually posted
  // Conversion tracking
  targetRepliedBack: boolean("target_replied_back").default(false),
  targetSubscribed: boolean("target_subscribed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  posts: many(posts),
  notes: many(notes),
  scheduledNotes: many(scheduledNotes),
  campaigns: many(campaigns),
}));

export const scheduledNotesRelations = relations(scheduledNotes, ({ one }) => ({
  user: one(user, {
    fields: [scheduledNotes.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));



export const postsRelations = relations(posts, ({ one }) => ({
  user: one(user, {
    fields: [posts.userId],
    references: [user.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(user, {
    fields: [campaigns.userId],
    references: [user.id],
  }),
  targets: many(campaignTargets),
}));

export const campaignTargetsRelations = relations(campaignTargets, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignTargets.campaignId],
    references: [campaigns.id],
  }),
  user: one(user, {
    fields: [campaignTargets.userId],
    references: [user.id],
  }),
}));
