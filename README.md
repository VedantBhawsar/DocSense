# DocSense 

[Demo](https://www.loom.com/share/f5cfbf0b98a74c42ad14dae0545605c4)

**Upload PDFs. Ask questions. Get answers.**

DocSense is a full-stack RAG (Retrieval-Augmented Generation) platform that lets you upload PDF documents and chat with them using semantic search and LLM-powered responses. Built as a production-ready monorepo with async document processing, vector embeddings, and a real-time progress pipeline.

---

## Key Features

- **PDF ingestion** — upload PDFs and get them chunked, embedded, and indexed automatically
- **Semantic search** — pgvector-powered similarity search across all your documents
- **AI chat** — ask questions against your document library with streamed LLM responses
- **Async processing** — BullMQ worker handles embedding jobs off the request path with real-time progress events
- **Shareable chats** — share conversation links with others
- **Auth** — JWT + refresh tokens, Google OAuth, email OTP, and password reset

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| API | Express 5, Bun runtime, Zod validation |
| Worker | BullMQ 5, LangChain, OpenAI SDK |
| Database | PostgreSQL 16 + pgvector (via Drizzle ORM) |
| Queue / Cache | Redis 7 (ioredis) |
| Object Storage | MinIO (S3-compatible, self-hosted) |
| Embeddings | NVIDIA NV-Embed-v1 via NVIDIA API |
| Monorepo | Turborepo 2, pnpm workspaces |
| Language | TypeScript 5.9 throughout |
| Reverse Proxy | Nginx (host-level, for production VPS deployments) |

**Architecture:** The API accepts uploads and enqueues a BullMQ job. The worker picks up jobs, splits PDFs into token-bounded chunks (800 tokens, 120 overlap), generates vector embeddings, and stores them in PostgreSQL. Progress events are published over Redis pub/sub and streamed to the browser via SSE. Queries hit a pgvector cosine-similarity index, and matching chunks are injected into the LLM context.

---

## Prerequisites

**Local development:**
- **Node.js** >= 18 (or Bun for running apps directly)
- **pnpm** >= 11.2.2 — `npm i -g pnpm`
- **Docker + Docker Compose** — for PostgreSQL, Redis, and MinIO
- An **OpenAI-compatible API key** (used for NVIDIA NV-Embed-v1 embeddings and chat completions)

**Production VPS:**
- **Docker + Docker Compose** (installed automatically via `deploy.sh --setup`)
- **Nginx** running on the host (to proxy traffic into the containerised web app)
- A domain or static IP

---

## Getting Started

### Local Development

#### 1. Clone and install

```bash
git clone https://github.com/VedantBhawsar/DocSense
cd DocSense
pnpm install
```

#### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 with pgvector at `localhost:5432`
- Redis 7 at `localhost:6379`
- MinIO object storage at `localhost:9000` (console at `localhost:9001`)

#### 3. Configure environment variables

Copy the examples and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env
```

See [Environment Variables](#environment-variables) below for what each key does.

#### 4. Run database migrations

```bash
pnpm --filter api db:migrate
```

#### 5. Start development

```bash
pnpm dev
```

This starts all apps in parallel via Turborepo:
- **Web** → http://localhost:3000
- **API** → http://localhost:3001
- **Worker** → background process, listens to Redis queue

---

## Production Deployment (VPS)

DocSense ships with a `deploy.sh` script that handles everything end-to-end on a Linux VPS.

### First-time setup

```bash
# Clone the repo on your VPS
git clone https://github.com/VedantBhawsar/DocSense /opt/DocSense
cd /opt/DocSense

# Run the setup wizard (installs Docker, creates .env interactively)
bash deploy.sh --setup
```

The script will:
1. Install Docker and Docker Compose if not already present
2. Walk you through filling in `.env` (auto-generates secrets, validates port availability)
3. Build all Docker images **sequentially** (one at a time to avoid freezing low-RAM VPS machines)
4. Start all containers in the correct dependency order
5. Wait for the API health check and print a summary

### Subsequent deploys (code updates)

```bash
cd /opt/DocSense
bash deploy.sh
```

### Full rebuild (after dependency changes)

```bash
bash deploy.sh --rebuild
```

### Docker service startup order

```
Tier 1 (parallel) : redis, db, minio
Tier 2            : migrate          ← runs Drizzle migrations, then exits
Tier 3 (parallel) : api, worker      ← start after migrate completes
Tier 4            : web              ← starts after api is healthy
```

### Connecting your host Nginx

The web container binds to `127.0.0.1:${WEB_PORT}` (default `3000`) on the host — it is never exposed publicly. Add a server block in your host Nginx to proxy traffic to it:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

If another app already owns port 3000, the setup script will detect the conflict and prompt you to choose a different port.

### MinIO dashboard

The MinIO console is accessible at port `9001` on your server (e.g. `http://your-server-ip:9001`). Use the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` values from your `.env` to log in.

---

## Environment Variables

In production all variables live in a single root `.env` file. The `deploy.sh` setup wizard creates this file interactively. For local development, copy per-app examples as described in [Getting Started](#getting-started).

### Root `.env` (production / Docker Compose)

```env
# ── Public URLs ───────────────────────────────────────────────────
APP_URL=http://your-vps-ip-or-domain
CORS_ORIGIN=http://your-vps-ip-or-domain
NEXTAUTH_URL=http://your-vps-ip-or-domain

# ── Secrets (auto-generated by deploy.sh if left blank) ──────────
JWT_SECRET=
JWT_REFRESH_SECRET=
NEXTAUTH_SECRET=
INTERNAL_SECRET=

# ── JWT expiry ────────────────────────────────────────────────────
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Database ──────────────────────────────────────────────────────
DB_USER=docsense
DB_PASSWORD=docsense123
DB_NAME=docsense
# (DATABASE_URL is constructed automatically from the above in docker-compose.yml)

# ── MinIO object storage ──────────────────────────────────────────
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=docs

# ── AI / Embeddings ───────────────────────────────────────────────
OPENAI_API_KEY=your-nvidia-api-key          # used by worker for embeddings
OPENAI_API_KEY_CHAT=your-nvidia-api-key     # used by api for chat completions

# ── Email (OTP / password reset) ──────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# ── Google OAuth (optional) ───────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Web port (host nginx proxies here) ────────────────────────────
WEB_PORT=3000
```

### `apps/api/.env` (local development only)

```env
PORT=3001
DATABASE_URL=postgresql://docsense:docsense123@localhost:5432/docsense
REDIS_URL=redis://localhost:6379

JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-in-production
JWT_REFRESH_EXPIRES_IN=7d

INTERNAL_SECRET=change-me-in-production

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=docs

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@docsense.app

APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### `apps/worker/.env` (local development only)

```env
DATABASE_URL=postgresql://docsense:docsense123@localhost:5432/docsense
REDIS_URL=redis://localhost:6379

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=docs

# NVIDIA NV-Embed-v1 via integrate.api.nvidia.com
OPENAI_API_KEY=your-nvidia-api-key
```

### `apps/web/.env` (local development only)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-production

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Usage

### Upload a document

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer <token>" \
  -F "file=@report.pdf"
```

The API responds immediately with a document ID and enqueues the processing job. Poll progress via SSE:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/documents/<id>/progress
```

### Chat with your documents

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Summarize the key findings", "documentId": "<id>"}'
```

---

## Project Structure

```
DocSense/
├── apps/
│   ├── api/            # Express 5 REST API (auth, documents, chat, search)
│   │   └── src/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── middleware/
│   │       └── routes/
│   ├── worker/         # BullMQ job processor (PDF parsing + embedding)
│   │   └── src/
│   │       └── index.ts
│   └── web/            # Next.js 16 frontend
│       └── app/
│           ├── (auth)/     # Login, register, password reset
│           ├── documents/  # Document library
│           ├── chat/       # Chat interface
│           └── billing/    # Subscription management
├── packages/
│   ├── db/             # Drizzle ORM schema, migrations, pgvector setup
│   ├── queue/          # BullMQ queue definitions and Redis client
│   ├── eslint-config/  # Shared ESLint config
│   └── typescript-config/ # Shared tsconfig bases
├── docker-compose.yml  # Full production stack (all services + resource limits)
├── Dockerfile.migrate  # Standalone image that runs Drizzle migrations and exits
├── deploy.sh           # VPS deployment script (setup, update, rebuild)
├── nginx.conf          # Example host Nginx config for reverse-proxying the app
└── turbo.json          # Turborepo pipeline config
```

---

## Architecture Decisions

### File Upload & Processing Pipeline

```
Browser                  API (Express)              Redis              Worker               PostgreSQL
  │                           │                       │                   │                     │
  │  POST /api/documents      │                       │                   │                     │
  │  (multipart/form-data)    │                       │                   │                     │
  │──────────────────────────▶│                       │                   │                     │
  │                           │  save file to disk    │                   │                     │
  │                           │  (multer → /uploads)  │                   │                     │
  │                           │                       │                   │                     │
  │                           │  INSERT document      │                   │                     │
  │                           │  status = "pending"   │                   │                     │
  │                           │──────────────────────────────────────────────────────────────▶ │
  │                           │                       │                   │                     │
  │                           │  pdfQueue.add(job)    │                   │                     │
  │                           │──────────────────────▶│                   │                     │
  │                           │                       │                   │                     │
  │  { documentId, status }   │                       │  dequeue job      │                     │
  │◀──────────────────────────│                       │──────────────────▶│                     │
  │                           │                       │                   │                     │
  │  GET /api/documents/:id/progress (SSE)            │  UPDATE status    │                     │
  │──────────────────────────▶│                       │  = "processing"   │                     │
  │                           │  subscribe to         │──────────────────────────────────────▶ │
  │                           │  Redis pub/sub        │                   │                     │
  │                           │◀─────────────────────▶│                   │  PDFLoader.load()   │
  │                           │                       │                   │  TokenTextSplitter  │
  │                           │                       │                   │  (800t / 120 overlap│
  │                           │                       │                   │                     │
  │                           │                       │                   │  for each chunk:    │
  │                           │                       │                   │  NVIDIA NV-Embed-v1 │
  │                           │                       │                   │  → embedding[]      │
  │                           │                       │                   │                     │
  │                           │                       │                   │  INSERT chunk +     │
  │                           │                       │                   │  pgvector embedding │
  │                           │                       │                   │──────────────────▶ │
  │                           │                       │                   │                     │
  │                           │                       │  publish progress │                     │
  │  event: chunk {i}/{total} │                       │◀──────────────────│                     │
  │◀──────────────────────────│◀─────────────────────▶│                   │                     │
  │         ...               │                       │                   │                     │
  │  event: ready             │                       │  UPDATE status    │                     │
  │◀──────────────────────────│◀─────────────────────▶│  = "ready"        │                     │
  │                           │                       │◀──────────────────│                     │
```

---

### Retrieval & Chat Pipeline

```
Browser                  API (Express)           PostgreSQL (pgvector)      LLM (OpenAI-compat)
  │                           │                           │                         │
  │  POST /api/chat           │                           │                         │
  │  { chatId, message }      │                           │                         │
  │──────────────────────────▶│                           │                         │
  │                           │                           │                         │
  │                           │  embedQuery(userText)     │                         │
  │                           │  → NVIDIA NV-Embed-v1     │                         │
  │                           │  [0.021, -0.43, ...]      │                         │
  │                           │                           │                         │
  │                           │  [parallel]               │                         │
  │                           │  ├─ getChatById()         │                         │
  │                           │  └─ embedQuery()          │                         │
  │                           │                           │                         │
  │                           │  SELECT chunks            │                         │
  │                           │  ORDER BY embedding       │                         │
  │                           │  <=> query_vector         │                         │
  │                           │  LIMIT 5                  │                         │
  │                           │──────────────────────────▶│                         │
  │                           │                           │                         │
  │                           │  top-5 chunks + metadata  │                         │
  │                           │◀──────────────────────────│                         │
  │                           │                           │                         │
  │                           │  build system prompt:     │                         │
  │                           │  [DOCUMENT CONTEXT]       │                         │
  │                           │  Excerpt 1 (Page 3)...    │                         │
  │                           │  Excerpt 2 (Page 7)...    │                         │
  │                           │  + last 10 chat messages  │                         │
  │                           │                           │                         │
  │                           │  streamAnswer(            │                         │
  │                           │    systemPrompt,          │                         │
  │                           │    history,               │                         │
  │                           │    userText               │                         │
  │                           │  )                        │                         │
  │                           │──────────────────────────────────────────────────▶ │
  │                           │                           │                         │
  │  token stream (SSE)       │  token stream             │                         │
  │◀──────────────────────────│◀──────────────────────────────────────────────────▶│
  │  "## Summary\n..."        │                           │                         │
  │         ...               │                           │                         │
  │  [stream end]             │                           │                         │
  │                           │  INSERT assistant message │                         │
  │                           │  incrementUsage()         │                         │
  │                           │──────────────────────────▶│                         │
```

---

### Why BullMQ over alternatives?

PDF processing in DocSense is the heaviest operation in the system — each document requires parsing, splitting into chunks, and making dozens of embedding API calls (one per chunk, rate-limited). This cannot happen in the request cycle. It needs a durable, retriable job queue.

| | BullMQ | Pg-boss | SQS | In-process queue |
|---|---|---|---|---|
| **Persistence** | Redis (AOF) | PostgreSQL | AWS-managed | Memory only |
| **Retries + backoff** | Built-in, per-job config | Built-in | Limited | Manual |
| **Real-time progress** | Redis pub/sub built-in | Polling only | No | Easy but no durability |
| **Concurrency control** | `concurrency` option + `p-limit` | Limited | Visibility timeout | Manual |
| **Infra already needed** | Redis (also used for cache) | Postgres (already present) | External dependency | None |
| **TypeScript SDK** | First-class | Good | AWS SDK | N/A |

**The deciding factors:**

- **Redis was already required** for session caching and SSE pub/sub. Adding BullMQ meant zero extra infrastructure.
- **Real-time progress via pub/sub** — BullMQ sits on Redis, so publishing chunk-level progress events (`{ event: "chunk", index: 3, total: 42 }`) to the same Redis connection is trivial. With pg-boss or SQS this would need a separate WebSocket or polling layer.
- **Exponential backoff on 429s** — the NVIDIA embedding API rate-limits aggressively. BullMQ's built-in retry with configurable backoff handles this cleanly without custom retry loops in application code.
- **Job visibility** — failed jobs stay in Redis with their full error and stack trace, inspectable via Bull Board or `redis-cli`. With an in-process queue, a worker crash loses everything.

**Trade-off accepted:** Redis is not a traditional durable message broker. If Redis loses data before a job is acknowledged (AOF not enabled, OOM eviction), the job is lost. For DocSense's use case — a user can always re-upload — this is acceptable. If guaranteed delivery were required, pg-boss over the existing PostgreSQL would be the next choice.

### Why pgvector over a dedicated vector database?

Pinecone, Weaviate, and Qdrant offer richer ANN index options, but they add an external service dependency. pgvector keeps vectors in the same PostgreSQL instance as the rest of the data, meaning joins between documents, chunks, and users are a single query with no network hop. At the scale DocSense targets (millions of chunks per user, not billions), pgvector's HNSW index is fast enough. The trade-off: if query latency becomes a bottleneck at scale, migrating to a dedicated vector store is a clean cut — the `search.repository.ts` layer abstracts all vector queries.

### Why Drizzle ORM over Prisma?

Drizzle generates SQL you can read and audit. There is no query engine binary, no Rust sidecar, and no `generate` step required at runtime. The schema is TypeScript — the same language as the rest of the codebase — so refactoring a column name is a type error, not a runtime surprise. Prisma's DX is excellent for simple CRUD, but its abstractions around raw SQL and pgvector operations required too many workarounds for DocSense's embedding queries.

---

## Development Commands

```bash
# Start everything
pnpm dev

# Build all packages and apps
pnpm build

# Type-check across the monorepo
pnpm check-types

# Lint everything
pnpm lint

# Format all files
pnpm format

# Database operations (run from repo root)
pnpm --filter api db:generate   # generate migration from schema changes
pnpm --filter api db:migrate    # apply migrations
pnpm --filter api db:studio     # open Drizzle Studio

# Run a single app
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter worker dev
```

---

## License

MIT
