ALTER TABLE "brand_brain_item" ADD COLUMN IF NOT EXISTS "source_key" text;
ALTER TABLE "brand_brain_item" ADD COLUMN IF NOT EXISTS "source_url" text;
CREATE UNIQUE INDEX IF NOT EXISTS "brand_brain_item_source_idx"
  ON "brand_brain_item" ("brand_id", "source_key");

ALTER TABLE "brand_brain_asset" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'user'
  CHECK ("source" IN ('user', 'discovery'));
ALTER TABLE "brand_brain_asset" ADD COLUMN IF NOT EXISTS "source_key" text;
ALTER TABLE "brand_brain_asset" ADD COLUMN IF NOT EXISTS "source_url" text;
CREATE UNIQUE INDEX IF NOT EXISTS "brand_brain_asset_source_idx"
  ON "brand_brain_asset" ("brand_id", "source_key");
