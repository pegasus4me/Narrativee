CREATE TABLE IF NOT EXISTS "discovery_message" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "analysis_id" uuid NOT NULL REFERENCES "site_analysis"("id") ON DELETE CASCADE,
  "role" text NOT NULL CHECK ("role" IN ('user', 'assistant')),
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "discovery_message_analysis_created_idx"
  ON "discovery_message" ("analysis_id", "created_at");

ALTER TABLE "discovery_message" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "discovery_message" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "discovery_message" FROM authenticated;
  END IF;
END $$;
