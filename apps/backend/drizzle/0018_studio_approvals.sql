ALTER TABLE studio_message ADD COLUMN IF NOT EXISTS approval_data jsonb;
ALTER TABLE studio_message ADD COLUMN IF NOT EXISTS approval_status text
  CHECK (approval_status IN ('pending', 'executing', 'completed', 'rejected', 'failed'));
ALTER TABLE studio_message ADD COLUMN IF NOT EXISTS approved_by text REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE studio_message ADD COLUMN IF NOT EXISTS approved_at timestamptz;
