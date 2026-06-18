
# --------- 1. dependencies ---------
FROM oven/bun:1.3.14 AS deps
WORKDIR /app

# Copy workspace manifests first to maximise layer caching
COPY package.json bun.lock* bun.lockb* ./
COPY apps/api/package.json        apps/api/package.json
COPY apps/web/package.json        apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

# ---------- 2. web-builder ----------
FROM oven/bun:1.3.14 AS web-builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules           ./node_modules
COPY --from=deps /app/apps/web/node_modules   ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy ONLY what the web app needs to build
COPY package.json bun.lock* bun.lockb* ./
COPY packages/shared                  ./packages/shared
COPY apps/web                         ./apps/web

# Build the SvelteKit SPA
RUN bun run --filter @couchrift/web build

# ---------- 3. api-builder ----------
FROM oven/bun:1.3.14 AS api-builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules                   ./node_modules
COPY --from=deps /app/apps/api/node_modules          ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules   ./packages/shared/node_modules

# Copy ONLY what the API needs to compile
COPY package.json bun.lock* ./
COPY packages/shared                  ./packages/shared
COPY apps/api                         ./apps/api

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
COPY --from=api-builder /app/apps/api/server ./server

# Copy the migration files
COPY --from=api-builder /app/apps/api/src/db/migrations ./migrations

# Copy the static SPA assets
COPY --from=web-builder /app/apps/web/build ./web-build

# Set environment variable pointing to the static assets
ENV STATIC_ASSETS_PATH=/app/web-build

EXPOSE 3000
CMD ["./server"]
