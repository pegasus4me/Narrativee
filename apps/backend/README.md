# Narrativee API

The production API runs on Render at [`www.api.narrativee.com`](https://www.api.narrativee.com), with Cloudflare proxying the public domain. The Render web service is defined in the repository-root [`render.yaml`](../../render.yaml); sync that Blueprint with the existing Render service to apply its health check, build filters, and deploy-after-CI settings. The API readiness endpoint is `/health`.

Render builds from the repository root with `apps/backend/Dockerfile`. Keep production secrets and service configuration in the existing Render environment. See [production deployment](../../docs/launch/deployment.md) for required settings and release checks.

For local development, create `apps/backend/.env` from `.env.example`, then run:

```sh
pnpm --filter backend dev
```

The API listens on port `3002` by default. To build and test the production container locally:

```sh
docker build -f apps/backend/Dockerfile -t narrativee-api .
```
