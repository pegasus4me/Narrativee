import { relations } from "drizzle-orm";
import {
  boolean,
  bigserial,
  integer,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const waitlistEntry = pgTable("waitlist_entry", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  fbclid: text("fbclid"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const brand = pgTable(
  "brand",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url"),
    creationKeyHash: text("creation_key_hash").unique(),
    guestTokenHash: text("guest_token_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("brand_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const siteAnalysis = pgTable(
  "site_analysis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: uuid("brand_id").references(() => brand.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    status: text("status").default("queued").notNull(),
    progress: integer("progress").default(0).notNull(),
    rawDocument: jsonb("raw_document"),
    diagnosis: jsonb("diagnosis"),
    competitorCandidates: jsonb("competitor_candidates"),
    selectedCompetitorUrls: jsonb("selected_competitor_urls"),
    competitorAnalysis: jsonb("competitor_analysis"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("site_analysis_brand_idx").on(table.brandId)],
);

export const discoveryMessage = pgTable(
  "discovery_message",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => siteAnalysis.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("discovery_message_analysis_created_idx").on(
      table.analysisId,
      table.createdAt,
    ),
  ],
);

export const studioProject = pgTable(
  "studio_project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("studio_project_user_idx").on(table.userId),
    index("studio_project_brand_idx").on(table.brandId),
  ],
);

export const studioMessage = pgTable(
  "studio_message",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sequence: bigserial("sequence", { mode: "number" }).notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => studioProject.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("studio_message_project_sequence_idx").on(
      table.projectId,
      table.sequence,
    ),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
