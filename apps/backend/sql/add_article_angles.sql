-- Run against your Postgres DB if drizzle-kit push is stuck or skipped.
-- Adds columns expected by apps/backend/src/auth/schema/schema.ts (articles).

ALTER TABLE articles ADD COLUMN IF NOT EXISTS extracted_angles jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS angles_extracted_at timestamp;
