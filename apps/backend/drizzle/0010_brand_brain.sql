CREATE TABLE IF NOT EXISTS "brand_brain_item" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand_id" uuid NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
  "kind" text NOT NULL CHECK ("kind" IN ('rule', 'inspiration', 'feedback')),
  "category" text NOT NULL CHECK ("category" IN ('identity', 'color', 'typography', 'imagery', 'voice', 'layout', 'other')),
  "content" text NOT NULL CHECK (length(trim("content")) BETWEEN 1 AND 4000),
  "source" text NOT NULL DEFAULT 'user' CHECK ("source" IN ('user', 'discovery')),
  "created_by" text REFERENCES "public"."user"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "archived_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "brand_brain_item_brand_idx" ON "brand_brain_item" ("brand_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "brand_brain_asset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand_id" uuid NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
  "kind" text NOT NULL CHECK ("kind" IN ('rule', 'inspiration')),
  "category" text NOT NULL CHECK ("category" IN ('identity', 'color', 'typography', 'imagery', 'layout', 'other')),
  "caption" text NOT NULL DEFAULT '' CHECK (length("caption") <= 1000),
  "object_key" text NOT NULL UNIQUE,
  "filename" text NOT NULL,
  "mime_type" text NOT NULL CHECK ("mime_type" IN ('image/png', 'image/jpeg', 'image/webp')),
  "bytes" integer NOT NULL CHECK ("bytes" BETWEEN 1 AND 8388608),
  "width" integer NOT NULL CHECK ("width" BETWEEN 1 AND 12000),
  "height" integer NOT NULL CHECK ("height" BETWEEN 1 AND 12000),
  "created_by" text REFERENCES "public"."user"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "archived_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "brand_brain_asset_brand_idx" ON "brand_brain_asset" ("brand_id", "created_at" DESC);

ALTER TABLE "brand_brain_item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brand_brain_asset" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "brand_brain_item", "brand_brain_asset" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "brand_brain_item", "brand_brain_asset" FROM authenticated;
  END IF;
END $$;
