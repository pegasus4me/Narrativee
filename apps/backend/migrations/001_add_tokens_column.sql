-- Migration: Add tokens column to user table
-- This enables token/credit tracking for all users
-- Free users: 50 tokens, Premium users: 1000 credits (configurable)

-- Add tokens column to user table (if not exists)
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "tokens" integer DEFAULT 50;

-- Create index for faster token balance queries
CREATE INDEX IF NOT EXISTS "user_tokens_idx" ON "user" ("tokens");

-- Update existing free plan users to have 50 tokens (if they don't have any)
UPDATE "user"
SET tokens = 50
WHERE plan = 'free' AND tokens IS NULL;

-- Update existing premium users to have 1000 credits (configurable later)
UPDATE "user"
SET tokens = 300
WHERE plan = 'premium' AND tokens IS NULL;

-- Comment
COMMENT ON COLUMN "user"."tokens" IS 'Token/credit balance for user. Free: tokens (50 default), Premium: credits (300 default, configurable)';
