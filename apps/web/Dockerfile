# ============================================
# Base Image
# ============================================

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# ============================================
# Builder Stage
# ============================================

FROM base AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy monorepo
COPY . .


# Prune only web app dependencies
RUN  pnpm turbo prune web --docker

# ============================================
# Installer Stage
# ============================================

FROM base AS installer

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy pruned package files
COPY --from=builder /app/out/json/ .

# Copy lockfile
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy full source
COPY --from=builder /app/out/full/ .

# Empty string → client bundles use relative paths; Next.js rewrites proxy internally
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build only web app
RUN pnpm turbo run build --filter=web

# ============================================
# Runner Stage
# ============================================

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup -S nextjs
RUN adduser -S nextjs -G nextjs

# Copy standalone output
COPY --from=installer --chown=nextjs:nextjs /app/apps/web/.next/standalone ./

# Copy static assets
COPY --from=installer --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static

COPY --from=installer --chown=nextjs:nextjs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]