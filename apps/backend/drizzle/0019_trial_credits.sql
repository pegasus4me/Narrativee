-- Existing accounts keep their current access. Only new accounts receive a trial.
-- Setting defaults after adding the columns avoids granting trials to old rows.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS trial_credits_remaining integer NOT NULL DEFAULT 0
  CHECK (trial_credits_remaining >= 0);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE "user" ALTER COLUMN trial_credits_remaining SET DEFAULT 80;
ALTER TABLE "user" ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '168 hours');
