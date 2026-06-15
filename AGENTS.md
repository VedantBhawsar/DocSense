# AGENTS.md

DocSense is a RAG platform: Next.js 16 web app + Express 5 API + BullMQ worker, all talking to Postgres+pgvector, Redis, and MinIO. The root `README.md` is comprehensive — read it for product context, env-var reference, and architecture diagrams before doing anything substantial. This file only flags things that an agent would otherwise get wrong.

## Layout (real entrypoints)

- `apps/api` — Express 5, ESM, dev: `bun --watch index.ts`, prod: `tsc` then `node dist/index.js`. Listens on `PORT` (default `3001`, not the `4000` the Dockerfile's `EXPOSE` claims).
- `apps/worker` — BullMQ processor. Single `src/index.ts`. Same Bun/Node split as the API.
- `apps/web` — Next.js 16 App Router + React 19. Auth via NextAuth v4 (`lib/auth.ts` + `proxy.ts` middleware). Standalone output for Docker.
- `packages/db` — Drizzle schema + migrations. `drizzle.config.ts` outputs to `./drizzle` (not `./src/migrations`).
- `packages/queue` — BullMQ queue + Redis pub/sub helpers (see "Queue contract" below).
- `packages/eslint-config`, `packages/typescript-config` — shared configs.

## Things that will trip you up

- **No tests anywhere.** No `test` script in any package, no test framework installed. Don't try to run `pnpm test` — there is nothing to run.
- **Lint only runs on `web`.** `apps/api`, `apps/worker`, `packages/db`, `packages/queue` have no `lint` script. `pnpm lint` at the root therefore only lints the frontend. `pnpm check-types` covers the rest via tsc/next typegen.
- **Two `drizzle/`-shaped directories.** `packages/db/drizzle/` is the live migrations dir (drizzle-kit writes here). `packages/db/src/migrations/` is leftover from a previous config — do not add files there, do not read it as truth.
- **`bun.lock` is stale.** Real package manager is pnpm 11.2.2 (`"packageManager"` in root `package.json`). Use `pnpm`. The api/worker dev scripts use `bun` only as a runtime for `--watch`, not for installs.
- **`.env` files differ between local and prod.** Local dev: copy each `apps/*/.env.example` to `apps/*/.env`. Production / Docker: a single root `.env` consumed by `docker-compose.yml`. `deploy.sh --setup` creates the root one interactively.
- **Embedding dimensions must match.** NVIDIA `nvidia/nv-embed-v1` returns 4096-dim vectors. The `chunks.embedding` column is `vector(4096)`. Do not change one without a migration + re-embed.
- **`EXPOSE 4000` in `apps/api/Dockerfile` is wrong.** The app honours `PORT` (default 3001) and the docker-compose `api` service sets `PORT: 3001`. Don't trust the EXPOSE line.
- **Per-user document limit of 2** is hardcoded in `apps/api/src/services/document.service.ts:21` (`count >= 2` → 403 `DOCUMENT_LIMIT`).
- **NextAuth `INTERNAL_SECRET` must match** the value the API reads from its env. The web sends it on the Google OAuth handshake (`apps/web/lib/auth.ts:76`).
- **Web → API URL strategy differs by environment.** Locally, client code uses `process.env.NEXT_PUBLIC_API_URL` (most pages import it directly instead of going through `lib/api-client.ts`). In Docker, `NEXT_PUBLIC_API_URL` is baked as `""` so the browser uses relative paths, and the Next.js rewrite in `next.config.js` (`/api/v1/:path*` → `${API_URL}/api/v1/:path*`) proxies to `http://api:3001` server-side.
- **No CI, no `.github/`, no pre-commit hooks, no commit-lint, no Conventional Commits.** Don't infer any of these.

## Dev workflow

```bash
# One-time per repo
cp apps/api/.env.example   apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example    apps/web/.env
docker compose up -d            # postgres+pgvector, redis, minio
pnpm install
pnpm --filter api db:migrate    # runs drizzle-kit migrate against @docsense/db

# Day-to-day
pnpm dev                        # turbo runs api (3001) + worker + web (3000) in parallel
pnpm --filter <name> dev        # run just one (api|web|worker)
pnpm check-types                # tsc across the monorepo
pnpm --filter web lint          # the only lint that actually runs
pnpm build                      # turbo build, depends on ^build
```

Schema changes:

```bash
# edit packages/db/src/schema/*.ts, then:
pnpm --filter api db:generate   # writes a new SQL file into packages/db/drizzle/
# review the generated SQL, then:
pnpm --filter api db:migrate
```

`pnpm --filter api db:*` and `pnpm --filter @docsense/db db:*` are equivalent — the api package's scripts delegate to the db package.

## Conventions

- **ESM everywhere.** All packages have `"type": "module"`. Relative imports must use the `.js` extension (e.g. `import { foo } from "./bar.js"`) — TypeScript with `moduleResolution: NodeNext` requires it even though the source is `.ts`.
- **API layered as** `routes → controllers → services → repositories`, plus `middleware/` and `lib/` (minio, redis-subscriber, llm, email). Match the existing layout when adding endpoints.
- **Worker error handling**: the `processPdf` job in `apps/worker/src/index.ts` is the reference for retry/backoff. It already wipes prior chunks for the document before re-inserting, and surfaces failure as a `failed` document status plus a Redis pub/sub event.
- **Queue contract** (`packages/queue/src/index.ts`):
  - Queue name: `pdf-processing`. Job name: `process-pdf`. Default: 3 attempts, exponential backoff 5s, `concurrency: 5`, `lockDuration: 5 min`.
  - Progress channel pattern: `doc-progress:{documentId}`. Payloads are `ProgressEvent` union (`processing | chunk | ready | failed`).
- **Drizzle types**: re-export tables and `InferSelectModel` / `InferInsertModel` from `@docsense/db`. Don't hand-roll types in app code.
- **Tailwind v4** in the web app, with shadcn (`components.json` is `base-nova` style, `lucide` icons). `@/components/ui` for primitives, `@/components/<feature>` for feature components. Framer Motion is in use for animations.

## Deployment

- `deploy.sh --setup` — first-time VPS bootstrap (installs Docker, writes root `.env`, builds + starts).
- `deploy.sh` — code updates.
- `deploy.sh --rebuild` — full image rebuild.
- Builds run sequentially (`for svc in migrate api worker web`) to keep VPS RAM in check — don't parallelise them.
- `Dockerfile.migrate` is a one-shot image: it applies migrations and exits; the `migrate` compose service has `restart: "no"`.
- The `web` container binds only to `127.0.0.1:${WEB_PORT}` — host nginx must reverse-proxy to it. See `nginx.conf` and the README's "Connecting your host Nginx" section.
- The `api`/`worker` blocks in `docker-compose.yml` are commented out by default; uncomment the whole block before first deploy.
