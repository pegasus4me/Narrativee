CREATE TABLE IF NOT EXISTS "brand_agent_settings" (
  "brand_id" uuid NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
  "agent" text NOT NULL CHECK ("agent" IN ('research', 'brand', 'creator')),
  "model" text,
  "response_length" text NOT NULL DEFAULT 'balanced' CHECK ("response_length" IN ('brief', 'balanced', 'detailed')),
  "instructions" text NOT NULL DEFAULT '' CHECK (char_length("instructions") <= 2000),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("brand_id", "agent")
);

-- Agent preferences are private and accessed through the authenticated backend.
ALTER TABLE "brand_agent_settings" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "brand_agent_settings" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "brand_agent_settings" FROM authenticated;
  END IF;
END $$;
