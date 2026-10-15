CREATE TABLE IF NOT EXISTS onboarding_profile (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  workspace_type text NOT NULL CHECK (workspace_type IN ('small_business', 'agency')),
  workspace_name text NOT NULL CHECK (length(trim(workspace_name)) BETWEEN 1 AND 120),
  agency_size text CHECK (agency_size IS NULL OR agency_size IN ('1-5', '6-10', '11-25', '26+')),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((workspace_type = 'agency' AND agency_size IS NOT NULL) OR (workspace_type = 'small_business' AND agency_size IS NULL))
);

ALTER TABLE onboarding_profile ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON onboarding_profile FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON onboarding_profile FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON onboarding_profile FROM authenticated;
  END IF;
END $$;
