CREATE TABLE IF NOT EXISTS "studio_project" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
  "brand_id" uuid NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "studio_project_user_idx" ON "studio_project" ("user_id");
CREATE INDEX IF NOT EXISTS "studio_project_brand_idx" ON "studio_project" ("brand_id");

CREATE TABLE IF NOT EXISTS "studio_message" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sequence" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "studio_project"("id") ON DELETE CASCADE,
  "role" text NOT NULL CHECK ("role" IN ('user', 'assistant')),
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "studio_message_project_sequence_idx"
  ON "studio_message" ("project_id", "sequence");

-- Better Auth sessions and ownership are checked by Express. Do not expose
-- these tables through Supabase's Data API.
ALTER TABLE "studio_project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "studio_message" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "studio_project", "studio_message" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "studio_project", "studio_message" FROM authenticated;
  END IF;
END $$;
