ALTER TABLE "site_analysis"
  ADD COLUMN IF NOT EXISTS "competitor_candidates" jsonb,
  ADD COLUMN IF NOT EXISTS "selected_competitor_urls" jsonb,
  ADD COLUMN IF NOT EXISTS "competitor_analysis" jsonb;
