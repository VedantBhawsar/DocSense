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

# Required native compatibility packages
RUN apk add --no-cache libc6-compat

# Copy monorepo
COPY . .

# Create pruned monorepo for worker
RUN pnpm turbo prune worker --docker

# ============================================
# Installer Stage
# ============================================

FROM base AS installer

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy pruned package manifests
COPY --from=builder /app/out/json/ .

# Copy lockfile
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY --from=builder /app/out/full/ .

# Build worker only
RUN pnpm turbo run build --filter=worker

# ============================================
# Runner Stage
# ============================================

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# PDF/document-processing related packages
RUN apk add --no-cache \
    libc6-compat \
    dumb-init

# Create non-root user
RUN addgroup -S worker
RUN adduser -S worker -G worker

# Copy built app
COPY --from=installer --chown=worker:worker /app ./

USER worker

# Use dumb-init for signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start worker
CMD ["pnpm", "--filter", "worker", "start"]