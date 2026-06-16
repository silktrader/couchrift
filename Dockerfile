# syntax=docker/dockerfile:1.7

# ---------- 1. deps ----------
FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app

# Copy workspace manifests first to maximise layer caching
COPY package.json bun.lock* bun.lockb* ./
COPY apps/api/package.json        apps/api/package.json
COPY apps/web/package.json        apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

# ---------- 2. builder ----------
FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules                   ./node_modules
COPY --from=deps /app/apps/api/node_modules          ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules          ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules   ./packages/shared/node_modules
COPY . .

# Build the SvelteKit SPA (adapter-static -> apps/web/build)
RUN bun run --filter @couchrift/web build

# ---------- 3. runner ----------
FROM oven/bun:1.3.14-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only tini for proper PID 1 signal handling
RUN apk add --no-cache tini \
 && addgroup -S app && adduser -S app -G app

# Copy only what the API needs at runtime
COPY --from=builder /app/package.json     ./package.json
COPY --from=builder /app/node_modules     ./node_modules
COPY --from=builder /app/packages/shared  ./packages/shared
COPY --from=builder /app/apps/api         ./apps/api
COPY --from=builder /app/apps/web/build   ./apps/web/build

# Data directory (SQLite DB + avatars) — will be a mounted volume
RUN mkdir -p /app/apps/api/data /app/apps/api/uploads/avatars \
 && chown -R app:app /app
USER app

WORKDIR /app/apps/api
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "run", "src/index.ts"]
