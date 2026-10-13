-- Author identity does not establish which agent the user originally addressed.
-- Existing conversations stay together in the team chat.
ALTER TABLE "studio_message" ADD COLUMN IF NOT EXISTS "thread" text NOT NULL
  DEFAULT 'team' CHECK ("thread" IN ('team', 'research', 'brand', 'creator'));

CREATE INDEX IF NOT EXISTS "studio_message_thread_sequence_idx"
  ON "studio_message" ("project_id", "thread", "sequence");
