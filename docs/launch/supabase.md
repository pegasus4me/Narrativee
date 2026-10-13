# Supabase database setup

Narrativee's development backend now connects to Supabase project `kgccrrksnimcjzwshvyd`. The user requested an empty application database; existing local accounts and projects were not copied. The two pre-existing unrelated Supabase tables were preserved.

The backend's ignored `.env` holds `DATABASE_URL`. `LOCAL_DATABASE_URL` is unset so local development also uses Supabase. The previous local connection settings are preserved in ignored `.data/local-database.env`. Never commit either file or paste credentials into documentation. Disposable database tests require an explicit local database connection and refuse remote hosts.

The URL uses `sslmode=verify-full&sslrootcert=certs/supabase-ca.crt`. The public CA certificate is included under `apps/backend/certs` and copied into the backend Docker image. Run backend commands from `apps/backend`, where the relative certificate path resolves. For deployments, configure the secret `DATABASE_URL` in the hosting environment with the same TLS parameters and relative certificate path; this local setup does not update hosted environment variables.

Run `pnpm --filter backend db:migrate-brands` to prepare the schema. The script initializes the base auth/schema migrations when `public.user` does not exist, then applies additive application migrations. `0022_server_only_tables.sql` enables RLS and removes client-facing table privileges for Narrativee's 28 tables. Better Auth and application ownership checks run in Express through the backend database role; these tables are not direct Supabase Auth/Data API resources. Unrelated tables are excluded from that migration.

On October 13, 2026, the user approved and migration `0023_brand_products.sql` was applied to the configured Supabase database. It adds `brand_product` and the optional `brand_brain_asset.product_id` association. Verification confirmed the composite brand/product foreign key, RLS, blocked `anon`/`authenticated` table access, and successful product/photo queries. The previously missing schema caused Brand Brain reads to fail; authenticated browser verification now confirms that the Studio Brand Brain Products view loads without the unavailable error. No existing records were deleted by this migration.

Verification confirmed encrypted database connections, backend account/brand/project writes, all 28 tables protected from `anon` and `authenticated` SELECT access, and real HTTP signup plus the 80-credit trial through the restarted development API. Transactional probes were rolled back and the temporary HTTP verification account was deleted. The new Narrativee database contains no accounts after verification.

Image bytes remain in local `.data/brand-brain` because R2 is not configured. This database setup does not move images into Supabase Storage. Browser drafts/preferences also remain in browser storage. Billing remains disabled pending its launch prerequisites in `billing.md`; no legacy trial launch grant was run.

Supabase's official guidance: https://supabase.com/docs/guides/database/connecting-to-postgres and https://supabase.com/docs/guides/platform/ssl-enforcement. The public CA was downloaded from Supabase's distribution at https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt.
