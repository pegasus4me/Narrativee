import { relations, sql } from "drizzle-orm";
import type {
  VisualApproval,
  ApprovalStatus,
} from "../../studio/visual-approval.types";
import {
  boolean,
  check,
  bigserial,
  bigint,
  integer,
  index,
  foreignKey,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    trialCreditsRemaining: integer("trial_credits_remaining")
      .default(80)
      .notNull(),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).default(
      sql`now() + interval '168 hours'`,
    ),
  },
  (table) => [
    check(
      "user_trial_credits_remaining_check",
      sql`${table.trialCreditsRemaining} >= 0`,
    ),
  ],
);

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
  surveyRole: text("survey_role"),
  surveyFirstUseCase: text("survey_first_use_case"),
  surveyCurrentWorkflow: text("survey_current_workflow"),
  surveyMainPain: text("survey_main_pain"),
  surveyFounderConversation: boolean("survey_founder_conversation"),
  surveyCompletedAt: timestamp("survey_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const brandBrainItem = pgTable(
  "brand_brain_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    category: text("category").notNull(),
    content: text("content").notNull(),
    source: text("source").default("user").notNull(),
    sourceKey: text("source_key"),
    sourceUrl: text("source_url"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("brand_brain_item_brand_idx").on(table.brandId, table.createdAt),
    uniqueIndex("brand_brain_item_source_idx").on(
      table.brandId,
      table.sourceKey,
    ),
  ],
);

export const brandProduct = pgTable(
  "brand_product",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("brand_product_brand_idx").on(table.brandId, table.createdAt),
    uniqueIndex("brand_product_id_brand_idx").on(table.id, table.brandId),
  ],
);

export const brandBrainAsset = pgTable(
  "brand_brain_asset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    kind: text("kind").notNull(),
    category: text("category").notNull(),
    caption: text("caption").default("").notNull(),
    source: text("source").default("user").notNull(),
    sourceKey: text("source_key"),
    sourceUrl: text("source_url"),
    objectKey: text("object_key").notNull().unique(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "brand_brain_asset_product_brand_fk",
      columns: [table.productId, table.brandId],
      foreignColumns: [brandProduct.id, brandProduct.brandId],
    }).onDelete("cascade"),
    index("brand_brain_asset_product_idx").on(table.productId),
    index("brand_brain_asset_brand_idx").on(table.brandId, table.createdAt),
    uniqueIndex("brand_brain_asset_source_idx").on(
      table.brandId,
      table.sourceKey,
    ),
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

export const brandAgentSettings = pgTable(
  "brand_agent_settings",
  {
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "cascade" }),
    agent: text("agent").$type<"research" | "brand" | "creator">().notNull(),
    model: text("model"),
    imageModel: text("image_model"),
    videoModel: text("video_model"),
    responseLength: text("response_length")
      .$type<"brief" | "balanced" | "detailed">()
      .default("balanced")
      .notNull(),
    instructions: text("instructions").default("").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.brandId, table.agent] })],
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
    title: text("title"),
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
    agent: text("agent").$type<"research" | "brand" | "creator">(),
    thread: text("thread")
      .$type<"team" | "research" | "brand" | "creator">()
      .default("team")
      .notNull(),
    content: text("content").notNull(),
    approvalData: jsonb("approval_data").$type<VisualApproval>(),
    approvalStatus: text("approval_status").$type<ApprovalStatus>(),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("studio_message_project_sequence_idx").on(
      table.projectId,
      table.sequence,
    ),
    index("studio_message_thread_sequence_idx").on(
      table.projectId,
      table.thread,
      table.sequence,
    ),
  ],
);

export const studioCanvas = pgTable("studio_canvas", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => studioProject.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").notNull(),
  revision: integer("revision").default(1).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const studioAsset = pgTable(
  "studio_asset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => studioProject.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("studio_asset_project_idx").on(table.projectId)],
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

// Billing tables use the same database as auth. Ledger mutations are short, account-locked SQL transactions.
export const billingAccount = pgTable("billing_account", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  customerId: text("customer_id").unique(),
  subscriptionId: text("subscription_id").unique(),
  plan: text("plan").notNull().default("trial"),
  status: text("status").notNull().default("trial"),
  interval: text("interval"),
  anchor: timestamp("anchor", { withTimezone: true }),
  paidUntil: timestamp("paid_until", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  checkoutId: text("checkout_id"),
  checkoutUrl: text("checkout_url"),
  checkoutExpiresAt: timestamp("checkout_expires_at", { withTimezone: true }),
  checkoutKey: text("checkout_key"),
  checkoutPlan: text("checkout_plan"),
  checkoutInterval: text("checkout_interval"),
  checkoutReturnPath: text("checkout_return_path"),
  upgradeKey: text("upgrade_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const creditBucket = pgTable(
  "credit_bucket",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => billingAccount.userId, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    allowance: bigint("allowance", { mode: "number" }).notNull(),
    spent: bigint("spent", { mode: "number" }).notNull().default(0),
    reserved: bigint("reserved", { mode: "number" }).notNull().default(0),
    revoked: boolean("revoked").notNull().default(false),
  },
  (table) => [
    index("credit_bucket_user_expiry").on(table.userId, table.expiresAt),
    check("credit_bucket_allowance_check", sql`${table.allowance}>=0`),
    check("credit_bucket_spent_check", sql`${table.spent}>=0`),
    check("credit_bucket_reserved_check", sql`${table.reserved}>=0`),
  ],
);
export const billableOperation = pgTable(
  "billable_operation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => billingAccount.userId, { onDelete: "cascade" }),
    requestKey: text("request_key").notNull(),
    action: text("action").notNull(),
    status: text("status").notNull().default("running"),
    delivered: boolean("delivered").notNull().default(false),
    result: jsonb("result"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("billable_operation_user_id_request_key_key").on(
      table.userId,
      table.requestKey,
    ),
    index("billable_operation_stale")
      .on(table.heartbeatAt)
      .where(sql`${table.status}='running'`),
  ],
);
export const providerCall = pgTable(
  "provider_call",
  {
    id: text("id").primaryKey(),
    operationId: text("operation_id")
      .notNull()
      .references(() => billableOperation.id, { onDelete: "cascade" }),
    bucketId: text("bucket_id")
      .notNull()
      .references(() => creditBucket.id),
    model: text("model").notNull(),
    rates: jsonb("rates").notNull(),
    reserved: bigint("reserved", { mode: "number" }).notNull(),
    cost: bigint("cost", { mode: "number" }),
    usage: jsonb("usage"),
    status: text("status").notNull().default("reserved"),
    absorbed: bigint("absorbed", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("provider_call_operation").on(table.operationId),
    index("provider_call_bucket").on(table.bucketId),
  ],
);
export const stripeEvent = pgTable(
  "stripe_event",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
  },
  (table) => [
    index("stripe_event_pending")
      .on(table.receivedAt)
      .where(sql`${table.processedAt} IS NULL`),
  ],
);
export const billingPayment = pgTable(
  "billing_payment",
  {
    invoiceId: text("invoice_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => billingAccount.userId),
    subscriptionId: text("subscription_id").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    plan: text("plan").notNull(),
    revoked: boolean("revoked").notNull().default(false),
  },
  (table) => [index("billing_payment_user").on(table.userId, table.periodEnd)],
);
