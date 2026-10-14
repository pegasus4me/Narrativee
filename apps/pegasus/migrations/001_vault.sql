begin;
create schema if not exists pegasus_vault;
revoke all on schema pegasus_vault from public, anon, authenticated;

create table if not exists pegasus_vault.projects (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null check (owner_email = 'safoantouil@gmail.com'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vault_projects_owner on pegasus_vault.projects(owner_email, created_at);
create table if not exists pegasus_vault.challenges (
  id text primary key,
  owner_email text not null check (owner_email = 'safoantouil@gmail.com'),
  code_hash text not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);
create index if not exists vault_challenges_owner_date on pegasus_vault.challenges(owner_email, created_at);
create table if not exists pegasus_vault.sessions (
  token_hash text primary key,
  owner_email text not null check (owner_email = 'safoantouil@gmail.com'),
  expires_at timestamptz not null default now() + interval '14 days'
);
create table if not exists pegasus_vault.ai_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create index if not exists vault_ai_requests_date on pegasus_vault.ai_requests(created_at);

-- This schema is server-only; the runtime role has no privileges on Narrativee tables.
grant usage on schema pegasus_vault to pegasus_vault_app;
grant select, insert, update, delete on all tables in schema pegasus_vault to pegasus_vault_app;
revoke all on all tables in schema pegasus_vault from public, anon, authenticated;
alter table pegasus_vault.projects enable row level security;
alter table pegasus_vault.projects force row level security;
alter table pegasus_vault.challenges enable row level security;
alter table pegasus_vault.sessions enable row level security;
alter table pegasus_vault.ai_requests enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='pegasus_vault' and tablename='projects' and policyname='vault_owner') then
    create policy vault_owner on pegasus_vault.projects to pegasus_vault_app
      using (owner_email='safoantouil@gmail.com') with check (owner_email='safoantouil@gmail.com');
    create policy vault_login on pegasus_vault.challenges to pegasus_vault_app using (true) with check (true);
    create policy vault_sessions on pegasus_vault.sessions to pegasus_vault_app using (true) with check (true);
    create policy vault_ai on pegasus_vault.ai_requests to pegasus_vault_app using (true) with check (true);
  end if;
end $$;
commit;
