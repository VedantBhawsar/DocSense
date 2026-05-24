FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ apps/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages ./packages
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]

FROM base AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages ./packages
CMD ["bun", "apps/worker/dist/src/index.js"]

FROM base AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/packages ./packages
EXPOSE 3000
CMD ["bun", "node_modules/next/bin/next.js", "start"]