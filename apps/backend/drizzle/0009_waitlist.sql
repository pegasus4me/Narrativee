CREATE TABLE IF NOT EXISTS "waitlist_entry" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_content" text,
  "utm_term" text,
  "fbclid" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Express writes with the server database connection. Keep lead emails out of
-- Supabase's client-facing Data API.
ALTER TABLE "waitlist_entry" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "waitlist_entry" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "waitlist_entry" FROM authenticated;
  END IF;
END $$;
