CREATE TABLE IF NOT EXISTS "brand" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text REFERENCES "public"."user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "url" text,
  "creation_key_hash" text UNIQUE,
  "guest_token_hash" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "brand_user_created_idx" ON "brand" ("user_id", "created_at");
ALTER TABLE "site_analysis" ADD COLUMN IF NOT EXISTS "brand_id" uuid REFERENCES "brand"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "site_analysis_brand_idx" ON "site_analysis" ("brand_id");

-- Better Auth sessions are checked by Express; these tables are not Data API resources.
ALTER TABLE "brand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_analysis" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "brand", "site_analysis" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "brand", "site_analysis" FROM authenticated;
  END IF;
END $$;
