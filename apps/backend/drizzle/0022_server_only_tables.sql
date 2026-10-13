-- Better Auth and application data are accessed only by the backend database role.
-- Supabase Auth UUIDs are not the application's Better Auth text user IDs.
DO $$
DECLARE name text;
BEGIN
  FOREACH name IN ARRAY ARRAY['account', 'articles', 'channels', 'content_sources', 'knowledge_base', 'session', 'social_posts', 'user', 'verification', 'oauth_states', 'creation_sessions', 'site_analysis', 'brand', 'discovery_message', 'studio_project', 'studio_message', 'waitlist_entry', 'brand_brain_item', 'brand_brain_asset', 'studio_canvas', 'studio_asset', 'brand_agent_settings', 'billing_account', 'credit_bucket', 'billable_operation', 'provider_call', 'stripe_event', 'billing_payment'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', name);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', name);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', name);
    END IF;
  END LOOP;
END $$;
