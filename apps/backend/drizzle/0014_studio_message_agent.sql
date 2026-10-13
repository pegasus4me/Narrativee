-- Older replies have no recorded author; preserve them without guessing.
ALTER TABLE "studio_message" ADD COLUMN IF NOT EXISTS "agent" text
  CHECK ("agent" IN ('research', 'brand', 'creator'));
