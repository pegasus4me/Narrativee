-- Run against your Postgres DB if drizzle-kit push is stuck or skipped.
-- Adds table expected by apps/backend/src/auth/schema/schema.ts (oauth_states).

CREATE TABLE IF NOT EXISTS "oauth_states" (
	"state" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"code_verifier" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
