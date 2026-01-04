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

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id),
  mode: text("mode").notNull().default('live'), // 'live' or 'test'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  lastEventAt: timestamp("last_event_at"), // Tracks when SDK last sent an event
});


// [NEW] SaaS Users Table (The end-users we track)
export const saasUsers = pgTable("saas_users", {
  id: text("id").notNull(), // The userId from the external SaaS. NOT unique globally anymore.
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id).notNull(),
  score: integer("score").default(0),
  metadata: jsonb("metadata"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.id, table.apiKeyId] }),
}));

// [NEW] Events Table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventName: text("event_name").notNull(),
  saasUserId: text("saas_user_id").notNull(),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// [NEW] Scoring Configs Table
export const scoringConfigs = pgTable("scoring_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id).notNull(),
  eventName: text("event_name").notNull(),
  scoreValue: integer("score_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// [NEW] Workflows Table
export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id).notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(false),
  nodes: jsonb("nodes").default([]),
  edges: jsonb("edges").default([]),
  triggerType: text("trigger_type").default('score'),
  triggerCondition: jsonb("trigger_condition"), // e.g. { operator: '>', value: 70 }
  actionType: text("action_type").default('popup'),
  actionConfig: jsonb("action_config"), // e.g. { title: 'Upgrade', body: '...' }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const requestLogs = pgTable("request_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id),
  method: text("method"),
  path: text("path"),
  status: integer("status"),
  duration: integer("duration"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  apiKeys: many(apiKeys),
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

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(user, {
    fields: [apiKeys.userId],
    references: [user.id],
  }),
  saasUsers: many(saasUsers),
  events: many(events),
  scoringConfigs: many(scoringConfigs),
  workflows: many(workflows),
}))
export const saasUsersRelations = relations(saasUsers, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [saasUsers.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [events.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const scoringConfigsRelations = relations(scoringConfigs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [scoringConfigs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [workflows.apiKeyId],
    references: [apiKeys.id],
  }),
}));
