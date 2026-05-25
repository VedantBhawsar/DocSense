FROM node:23-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy monorepo
COPY . .

# Install dependencies
RUN pnpm install

# Build turbo apps
RUN pnpm turbo run build --filter=api

EXPOSE 4000

CMD ["pnpm", "--filter", "api", "start"]