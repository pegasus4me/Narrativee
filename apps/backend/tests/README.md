# Brand flow checks

Run from `apps/backend` against an **empty, disposable** database named `brand_flow_test`:

```sh
TEST_DATABASE_URL=postgresql://postgres:password@127.0.0.1:55439/brand_flow_test pnpm test:brands
```

The test applies the existing baseline and additive brand migrations, uses real Better Auth email sessions and HTTP endpoints, and checks ownership, guest claims, replayed/concurrent creation, legacy links, and persistence across sessions. Scraping/LLM execution is replaced with a counter: no external provider calls are made. The database is deliberately not cleared by the test; recreate the disposable database before another run.

Apply the schema to an application database before deploying the new routes:

```sh
pnpm db:migrate-brands
```

This uses `LOCAL_DATABASE_URL`, falling back to `DATABASE_URL`, and runs migrations 0004–0006 transactionally and idempotently. It does not replay the unrelated old Drizzle history, which is incomplete in this repository.

Brand records are accessed through Express and Better Auth. Supabase Data API roles have no direct access to brand or analysis tables. Anonymous legacy analyses remain readable through the old API, but cannot be claimed using only an analysis ID. New guest brands require their HttpOnly cookie; claims invalidate guest access.

Discovery shows the saved diagnosis and requires competitor confirmation before running the comparison. Google callback destinations use the same constrained return-path resolver as email auth; live Google OAuth still needs a manual check with the configured provider.
