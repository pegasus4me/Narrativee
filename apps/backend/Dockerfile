# ---------------------------
# Base Image
# ---------------------------
FROM node:18-alpine AS base
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# ---------------------------
# Prepare stage
# ---------------------------
FROM base AS prepare

# Install pnpm + turbo (same major version as your repo)
RUN npm install -g pnpm turbo@^2

# Copy the entire monorepo
COPY . .

# Generate pruned output for the backend workspace
RUN turbo prune backend --docker

# ---------------------------
# Builder stage
# ---------------------------
FROM base AS builder

# Install pnpm in the builder stage
RUN npm install -g pnpm

# Install dependencies based on pruned lockfile
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile --shamefully-hoist


# Copy the full source required to build
COPY --from=prepare /app/out/full/ .

# Build backend (Turbo pipeline)
RUN pnpm run build --filter=backend

# ---------------------------
# Runner stage
# ---------------------------
FROM base AS runner

# Don’t run as root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 backend
USER backend

WORKDIR /app

# Copy the built backend
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json .

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]

EXPOSE 3002

