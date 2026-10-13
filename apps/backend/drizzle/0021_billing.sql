-- Integer microdollars: 10,000 microdollars = one credit. No floating point ledger.
CREATE TABLE IF NOT EXISTS billing_account (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  customer_id text UNIQUE, subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro')),
  status text NOT NULL DEFAULT 'trial', interval text,
  anchor timestamptz, paid_until timestamptz, cancel_at_period_end boolean NOT NULL DEFAULT false,
  checkout_id text, checkout_url text, checkout_expires_at timestamptz,
  checkout_key text, checkout_plan text, checkout_interval text, checkout_return_path text,
  upgrade_key text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS credit_bucket (
  id text PRIMARY KEY, user_id text NOT NULL REFERENCES billing_account(user_id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('trial','paid')), starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL, allowance bigint NOT NULL CHECK (allowance>=0),
  spent bigint NOT NULL DEFAULT 0 CHECK (spent>=0), reserved bigint NOT NULL DEFAULT 0 CHECK (reserved>=0),
  revoked boolean NOT NULL DEFAULT false, CHECK (expires_at>starts_at)
);
CREATE INDEX IF NOT EXISTS credit_bucket_user_expiry ON credit_bucket(user_id, expires_at);
CREATE TABLE IF NOT EXISTS billable_operation (
  id text PRIMARY KEY, user_id text NOT NULL REFERENCES billing_account(user_id) ON DELETE CASCADE,
  request_key text NOT NULL, action text NOT NULL, status text NOT NULL DEFAULT 'running',
  delivered boolean NOT NULL DEFAULT false, result jsonb, error text,
  started_at timestamptz NOT NULL DEFAULT now(), heartbeat_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz, UNIQUE (user_id, request_key)
);
CREATE INDEX IF NOT EXISTS billable_operation_stale ON billable_operation(heartbeat_at) WHERE status='running';
CREATE TABLE IF NOT EXISTS provider_call (
  id text PRIMARY KEY, operation_id text NOT NULL REFERENCES billable_operation(id) ON DELETE CASCADE,
  bucket_id text NOT NULL REFERENCES credit_bucket(id), model text NOT NULL, rates jsonb NOT NULL,
  reserved bigint NOT NULL CHECK(reserved>=0), cost bigint CHECK(cost>=0), usage jsonb,
  status text NOT NULL DEFAULT 'reserved', absorbed bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_call_operation ON provider_call(operation_id);
CREATE INDEX IF NOT EXISTS provider_call_bucket ON provider_call(bucket_id);
CREATE TABLE IF NOT EXISTS stripe_event (
  id text PRIMARY KEY, type text NOT NULL, payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, error text, attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS stripe_event_pending ON stripe_event(received_at) WHERE processed_at IS NULL;
CREATE TABLE IF NOT EXISTS billing_payment (
  invoice_id text PRIMARY KEY, user_id text NOT NULL REFERENCES billing_account(user_id),
  subscription_id text NOT NULL, period_start timestamptz NOT NULL, period_end timestamptz NOT NULL,
  plan text NOT NULL CHECK(plan IN ('starter','pro')), revoked boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS billing_payment_user ON billing_payment(user_id,period_end);
-- Import enrolled trials once; legacy trial grants are a separate explicit launch action.
INSERT INTO billing_account(user_id) SELECT id FROM "user" ON CONFLICT DO NOTHING;
INSERT INTO credit_bucket(id,user_id,kind,starts_at,expires_at,allowance,spent)
SELECT 'trial:'||id,id,'trial',trial_ends_at-interval '168 hours',trial_ends_at,800000,
       greatest(0,80-trial_credits_remaining)::bigint*10000
FROM "user" WHERE trial_ends_at IS NOT NULL ON CONFLICT DO NOTHING;

ALTER TABLE billing_account ADD COLUMN IF NOT EXISTS checkout_return_path text;
-- Billing is server-owned. No browser/Data API role may mutate or read ledger records.
ALTER TABLE billing_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_bucket ENABLE ROW LEVEL SECURITY;
ALTER TABLE billable_operation ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_call ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payment ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing_account,credit_bucket,billable_operation,provider_call,stripe_event,billing_payment FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON billing_account,credit_bucket,billable_operation,provider_call,stripe_event,billing_payment FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON billing_account,credit_bucket,billable_operation,provider_call,stripe_event,billing_payment FROM authenticated;
  END IF;
END $$;
