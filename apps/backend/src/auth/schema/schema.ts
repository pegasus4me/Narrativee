import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, primaryKey } from "drizzle-orm/pg-core";

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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  posts: many(posts),
  notes: many(notes),
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
