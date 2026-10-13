CREATE TABLE IF NOT EXISTS "brand_product" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand_id" uuid NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
  "name" text NOT NULL CHECK (length(trim("name")) BETWEEN 1 AND 160),
  "description" text NOT NULL CHECK (length(trim("description")) BETWEEN 1 AND 4000),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "archived_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "brand_product_brand_idx" ON "brand_product" ("brand_id", "created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "brand_product_id_brand_idx" ON "brand_product" ("id", "brand_id");

ALTER TABLE "brand_brain_asset" ADD COLUMN IF NOT EXISTS "product_id" uuid;
CREATE INDEX IF NOT EXISTS "brand_brain_asset_product_idx" ON "brand_brain_asset" ("product_id");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_brain_asset_product_brand_fk' AND conrelid = 'brand_brain_asset'::regclass) THEN
    ALTER TABLE "brand_brain_asset" ADD CONSTRAINT "brand_brain_asset_product_brand_fk"
      FOREIGN KEY ("product_id", "brand_id") REFERENCES "brand_product" ("id", "brand_id") ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE "brand_product" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "brand_product" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "brand_product" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "brand_product" FROM authenticated;
  END IF;
END $$;
