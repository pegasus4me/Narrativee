CREATE TABLE IF NOT EXISTS studio_canvas (
  project_id uuid PRIMARY KEY REFERENCES studio_project(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS studio_asset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES studio_project(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  bytes integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_asset_project_idx ON studio_asset(project_id);
ALTER TABLE studio_canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_asset ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON studio_canvas, studio_asset FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON studio_canvas, studio_asset FROM authenticated;
  END IF;
END $$;
