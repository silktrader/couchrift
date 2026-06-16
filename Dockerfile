# syntax=docker/dockerfile:1.7

# ---------- 1. deps ----------
FROM oven/bun:1.3.14 AS deps
WORKDIR /app

# Copy workspace manifests first to maximise layer caching
COPY package.json bun.lock* bun.lockb* ./
COPY apps/api/package.json        apps/api/package.json
COPY apps/web/package.json        apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

# ---------- 2. builder ----------
FROM oven/bun:1.3.14 AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules                   ./node_modules
COPY --from=deps /app/apps/api/node_modules          ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules          ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules   ./packages/shared/node_modules
COPY . .

# Build the SvelteKit SPA (adapter-static -> apps/web/build)
RUN bun run --filter @couchrift/web build

# Compile the Elysia API server into a standalone binary
WORKDIR /app/apps/api
RUN bun build \
  --compile \
  --minify-whitespace \
  --minify-syntax \
  --outfile server \
  src/index.ts

# ---------- 3. runner ----------
FROM gcr.io/distroless/base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the compiled standalone server binary
COPY --from=builder /app/apps/api/server ./server

# Copy the static SPA assets
COPY --from=builder /app/apps/web/build ./web-build

# Set environment variable pointing to the static assets
ENV STATIC_ASSETS_PATH=/app/web-build

EXPOSE 3000
CMD ["./server"]
