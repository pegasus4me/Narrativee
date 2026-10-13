# ---------------------------
# Base Image
# ---------------------------
FROM node:22-alpine AS base
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# ---------------------------
# Prepare stage
# ---------------------------
FROM base AS prepare

# Install pnpm + turbo (same major version as your repo)
RUN npm install -g pnpm@9.0.0 turbo@2.6.1

# Copy the entire monorepo
COPY . .

# Generate pruned output for the backend workspace
RUN turbo prune backend --docker

# ---------------------------
# Builder stage
# ---------------------------
FROM base AS builder

# Install pnpm in the builder stage
RUN npm install -g pnpm@9.0.0

# Install dependencies based on pruned lockfile
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile --shamefully-hoist


# Copy the full source required to build
COPY --from=prepare /app/out/full/ .

# Build backend (Turbo pipeline)
RUN pnpm --filter backend build

# ---------------------------
# Runner stage
# ---------------------------
FROM base AS runner
ENV NODE_ENV=production
ARG APP_REVISION
ENV APP_REVISION=$APP_REVISION

# Don’t run as root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 backend
USER backend

WORKDIR /app

# Copy the built backend
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json .
COPY --from=builder /app/apps/backend/certs ./certs
COPY --from=builder /app/apps/backend/drizzle ./drizzle

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules
CMD ["sh", "-c", "node dist/migrate-brands.js && exec node dist/index.js"]

EXPOSE 3002
