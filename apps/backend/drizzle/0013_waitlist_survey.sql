ALTER TABLE "waitlist_entry"
  ADD COLUMN IF NOT EXISTS "survey_role" text,
  ADD COLUMN IF NOT EXISTS "survey_first_use_case" text,
  ADD COLUMN IF NOT EXISTS "survey_current_workflow" text,
  ADD COLUMN IF NOT EXISTS "survey_main_pain" text,
  ADD COLUMN IF NOT EXISTS "survey_founder_conversation" boolean,
  ADD COLUMN IF NOT EXISTS "survey_completed_at" timestamptz;
