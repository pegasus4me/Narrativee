ALTER TABLE "user" ALTER COLUMN trial_credits_remaining SET DEFAULT 400;

-- Earlier migrations replay on startup and may initialize a new trial at the old allowance.
UPDATE credit_bucket AS bucket
SET allowance = 4000000
FROM "user" AS account
WHERE bucket.id = 'trial:' || account.id
  AND account.trial_credits_remaining = 400
  AND bucket.allowance = 800000
  AND bucket.spent = 0
  AND bucket.reserved = 0;
