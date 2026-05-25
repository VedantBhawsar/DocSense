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

COPY . .

RUN pnpm turbo prune worker --docker

# ============================================
# Installer Stage
# ============================================

FROM base AS installer

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=builder /app/out/json/ .

COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

RUN pnpm turbo run build --filter=worker

# ============================================
# Runner Stage
# ============================================

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache \
    libc6-compat \
    dumb-init

RUN addgroup -S worker
RUN adduser -S worker -G worker

COPY --from=installer --chown=worker:worker /app ./

USER worker

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "apps/worker/dist/src/index.js"]