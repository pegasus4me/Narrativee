# Production deployment

The release workflows run on `main` pushes that change the deployed application or shared build files, and on manual dispatch. Each workflow runs on one Ubuntu/Node 22 environment with pnpm 9 and the frozen lockfile. No browser matrix or paid AI calls are part of CI.

## Before deployment

The backend is hosted on Render. [`render.yaml`](../../render.yaml) declares the `narrativee-api` Docker service, its `/health` check, monorepo build filters, and deploy-after-checks behavior. Sync this Blueprint with the existing Render service to make those deployment settings authoritative. The backend checks TypeScript, unit tests, and HTTP workflows in disposable Postgres databases: migration initialization/replay, brand access and guest compatibility, products/photos, Studio conversations/settings, approved creative creation and canvas persistence, trial expiry, and billing/credit accounting. They also build the production container without publishing it.

The frontend checks TypeScript and the existing onboarding, product preview, agent chat, output selection, approval, canvas/export and auth-tracking tests. Test files run sequentially to keep DOM/canvas checks light on CI resources. Next.js is updated to 16.3.8; the installed OpenNext adapter builds with Webpack. OpenNext builds the Worker once; Wrangler validates that bundle before the same bundle is deployed. The old Pages upload of `.next` is removed. Public API URLs are supplied explicitly at build time.

## Deployment and checks

Once the Blueprint is synced, Render builds the backend image from the repository root using `apps/backend/Dockerfile`, waits for CI checks, and probes `/health` before routing traffic. The backend image carries its Git commit and migration command. Migrations run transactionally before the API starts, with a lock and query timeout. CI verifies that replay preserves saved products. `/health` checks database connectivity and the current product schema, and requires the R2 settings in production. This checks configuration presence; it does not prove bucket permissions. The public API remains `https://www.api.narrativee.com`, with Cloudflare in front of Render.

After the frontend deployment, the smoke script waits up to two minutes for the expected Git commit. Frontend checks include its release endpoint, landing page, sign-in and Studio HTML. The same script supports backend readiness, a logged-out session response, protected brand access and production CORS; attach that check after the new provider's deployment completes. A stale version or failed request fails the workflow; it cannot silently report success. This reports failures but does not automatically roll back a release.

## Required configuration

- GitHub secrets for the frontend: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Render uses its GitHub integration and Blueprint configuration; backend secrets stay in the Render service environment, not GitHub Actions.
- Optional GitHub variables: `PRODUCTION_API_URL`, `PRODUCTION_FRONTEND_URL`. Defaults preserve the public Narrativee domains. Confirm that these domains point to the current services.
- Backend runtime in Render: `DATABASE_URL` with its trusted CA, Better Auth/OpenAI/analysis settings, and all four R2 settings (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`). Keep the existing Render environment variables and secrets when syncing the Blueprint. Provider/model rates must match the models used. Paid billing retains its separate verified-launch requirements in [billing.md](billing.md).
- Cloudflare: connect the `narrativee` Worker to the production domain before declaring the frontend release live. CI checks that the real domain serves the new commit. Keep optional `POSTHOG_PERSONAL_API_KEY` in Worker secrets rather than Wrangler variables. Unused frontend database/auth bindings were removed.

Previously hardcoded secrets remain in Git history and need rotation at their providers. Development images currently stored in `.data/brand-brain` must be copied to production image storage if those existing products/references are to be retained; database migrations do not copy image files.

## Local verification

```sh
pnpm check-types
pnpm --filter backend test:unit
pnpm --filter web test:ci
pnpm test:deploy
```

`pnpm --filter backend test:ci` additionally needs an explicit local `LOCAL_DATABASE_URL`; its runner refuses remote hosts and removes only databases it creates. Database workflows are skipped during the unit-only pass, then explicitly executed by this integration runner.

On October 13, 2026, the local suites, production Docker build/runtime imports, container startup against a disposable database, migration replay, readiness/auth/CORS checks, OpenNext build and Worker dry run were verified. These checks do not establish paid-provider image quality, real Google OAuth, R2 object permissions, Stripe production configuration or a completed GitHub deployment. Test the real signup → website → materials/product → proposal → approval → image → reopen → PNG export flow once on the production URL before opening paid acquisition.
