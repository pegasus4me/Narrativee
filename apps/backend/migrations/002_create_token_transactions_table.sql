-- Migration: Create token_transactions table for tracking token usage
-- This table records every token deduction/addition for audit and analytics

CREATE TABLE IF NOT EXISTS "token_transactions" (
  "id" text NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "action" text NOT NULL CHECK (action IN ('report_generation', 'chat_question', 'chat_edit', 'chat_regenerate', 'manual_addition', 'purchase', 'promo')),
  "tokens_cost" integer NOT NULL,
  "tokens_remaining" integer NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "token_transactions_user_id_idx" ON "token_transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "token_transactions_created_at_idx" ON "token_transactions" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "token_transactions_action_idx" ON "token_transactions" ("action");

-- Comments
COMMENT ON TABLE "token_transactions" IS 'Records all token transactions for users (deductions and additions)';
COMMENT ON COLUMN "token_transactions"."action" IS 'Type of action: report_generation, chat_question, chat_edit, chat_regenerate, manual_addition, purchase, promo';
COMMENT ON COLUMN "token_transactions"."tokens_cost" IS 'Number of tokens consumed (negative for additions)';
COMMENT ON COLUMN "token_transactions"."tokens_remaining" IS 'User token balance after transaction';
COMMENT ON COLUMN "token_transactions"."metadata" IS 'Additional context (e.g., report ID, model used, etc.)';
