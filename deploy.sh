#!/usr/bin/env bash
# deploy.sh — DocSense VPS deployment script
# Usage:
#   First run   : bash deploy.sh --setup
#   Updates     : bash deploy.sh
#   Full rebuild : bash deploy.sh --rebuild

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Parse flags ──────────────────────────────────────────────────────────────
SETUP=false
REBUILD=false
for arg in "$@"; do
  case $arg in
    --setup)   SETUP=true ;;
    --rebuild) REBUILD=true ;;
    --help|-h)
      echo "Usage: bash deploy.sh [--setup] [--rebuild]"
      echo "  --setup    First-time setup: installs Docker, walks through .env"
      echo "  --rebuild  Force full rebuild of all Docker images"
      exit 0 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Install Docker & Docker Compose (only on --setup)
# ─────────────────────────────────────────────────────────────────────────────
install_docker() {
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  usermod -aG docker "$USER" 2>/dev/null || true
  success "Docker installed"
}

install_compose() {
  info "Installing Docker Compose plugin..."
  DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
  mkdir -p "$DOCKER_CONFIG/cli-plugins"
  COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest \
    | grep '"tag_name"' | cut -d'"' -f4)
  curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
  chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
  success "Docker Compose $COMPOSE_VERSION installed"
}

if $SETUP; then
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   DocSense — First-time VPS Setup    ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
  echo ""

  if ! command -v docker &>/dev/null; then
    install_docker
  else
    success "Docker already installed ($(docker --version | cut -d' ' -f3 | tr -d ','))"
  fi

  if ! docker compose version &>/dev/null 2>&1; then
    install_compose
  else
    success "Docker Compose already installed"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Sanity checks
# ─────────────────────────────────────────────────────────────────────────────
echo ""
info "Checking requirements..."
command -v docker &>/dev/null      || error "Docker not found. Run: bash deploy.sh --setup"
docker compose version &>/dev/null || error "Docker Compose not found. Run: bash deploy.sh --setup"
[ -f "docker-compose.yml" ]        || error "docker-compose.yml not found. Are you in the project root?"
[ -f "infra/docker.compose.yml" ]  || error "infra/docker.compose.yml not found. Are you in the project root?"
[ -f "nginx.conf" ]                || error "nginx.conf not found. Are you in the project root?"
success "Requirements satisfied"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Create / fill .env
# ─────────────────────────────────────────────────────────────────────────────
echo ""
info "Checking .env..."

# Only prompt for a variable if it is missing or empty in .env
prompt_var() {
  local var="$1" label="$2" default="$3" secret="${4:-false}"
  local current
  current=$(grep -E "^${var}=" .env 2>/dev/null | cut -d'=' -f2- || true)
  [ -n "$current" ] && return   # already has a value — skip

  if [ "$secret" = "true" ]; then
    read -rsp "  ${label} [default: ${default:-<auto>}]: " val; echo
  else
    read -rp  "  ${label} [default: ${default:-<blank>}]: " val
  fi
  val="${val:-$default}"
  # Update existing empty key or append
  if grep -qE "^${var}=" .env 2>/dev/null; then
    sed -i "s|^${var}=.*|${var}=${val}|" .env
  else
    echo "${var}=${val}" >> .env
  fi
}

generate_secret() {
  openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 48 || true
}

pick_port() {
  local current
  current=$(grep -E "^WEB_PORT=" .env 2>/dev/null | cut -d'=' -f2- || true)
  [ -n "$current" ] && { info "Web port already set to $current in .env"; return; }

  local port
  while true; do
    read -rp "  Port for the web app (host nginx will proxy here) [default: 3000]: " port
    port="${port:-3000}"

    # Validate it's a number in valid range
    if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
      warn "  '$port' is not a valid port number. Try again."
      continue
    fi

    # Check if port is already in use on the host
    if ss -tlnp 2>/dev/null | grep -q ":${port} " || \
       lsof -iTCP:"$port" -sTCP:LISTEN -n -P 2>/dev/null | grep -q LISTEN; then
      warn "  Port $port is already in use. Choose a different port."
      continue
    fi

    # All good
    if grep -qE "^WEB_PORT=" .env 2>/dev/null; then
      sed -i "s|^WEB_PORT=.*|WEB_PORT=${port}|" .env
    else
      echo "WEB_PORT=${port}" >> .env
    fi
    success "Web app will be available on 127.0.0.1:${port}"
    break
  done
}

if [ ! -f ".env" ]; then
  [ -f ".env.example" ] && cp .env.example .env || touch .env
  info "Created .env — please fill in the values below"
fi

echo ""
echo -e "${YELLOW}  Fill in required values (press Enter to use the default):${NC}"
echo ""

# Public URLs
prompt_var "APP_URL"      "Your VPS IP or domain (e.g. http://1.2.3.4)" "http://localhost"
prompt_var "CORS_ORIGIN"  "CORS origin — usually same as APP_URL"        "http://localhost"
prompt_var "NEXTAUTH_URL" "NextAuth URL — usually same as APP_URL"       "http://localhost"

# Auto-generate secrets if blank
DEFAULT_JWT=$(generate_secret)
DEFAULT_REFRESH=$(generate_secret)
DEFAULT_NEXTAUTH=$(generate_secret)
DEFAULT_INTERNAL=$(generate_secret)

prompt_var "JWT_SECRET"         "JWT secret (auto-generated if blank)"        "$DEFAULT_JWT"      true
prompt_var "JWT_REFRESH_SECRET" "JWT refresh secret (auto-generated)"         "$DEFAULT_REFRESH"  true
prompt_var "NEXTAUTH_SECRET"    "NextAuth secret (auto-generated)"            "$DEFAULT_NEXTAUTH" true
prompt_var "INTERNAL_SECRET"    "Internal service secret (auto-generated)"    "$DEFAULT_INTERNAL" true

# Database
prompt_var "DB_USER"     "Postgres username" "docsense"
prompt_var "DB_PASSWORD" "Postgres password" "docsense123" true
prompt_var "DB_NAME"     "Postgres database" "docsense"

# MinIO
prompt_var "MINIO_ROOT_USER"     "MinIO root user"     "minioadmin"
prompt_var "MINIO_ROOT_PASSWORD" "MinIO root password" "minioadmin123" true
prompt_var "MINIO_ACCESS_KEY"    "MinIO access key"    "minioadmin"
prompt_var "MINIO_SECRET_KEY"    "MinIO secret key"    "minioadmin123" true
prompt_var "MINIO_BUCKET"        "MinIO bucket name"   "docs"

# AI keys
prompt_var "OPENAI_API_KEY"      "NVIDIA API key (embeddings)" "" true
prompt_var "OPENAI_API_KEY_CHAT" "NVIDIA API key (chat)"       "" true

# Web port
pick_port

# SMTP
prompt_var "SMTP_HOST" "SMTP host"         "smtp.gmail.com"
prompt_var "SMTP_PORT" "SMTP port"         "587"
prompt_var "SMTP_USER" "SMTP login email"  ""
prompt_var "SMTP_PASS" "SMTP app password" "" true
prompt_var "SMTP_FROM" "From address"      "noreply@yourdomain.com"

# Google OAuth (optional)
prompt_var "GOOGLE_CLIENT_ID"     "Google OAuth client ID (Enter to skip)"     ""
prompt_var "GOOGLE_CLIENT_SECRET" "Google OAuth client secret (Enter to skip)" "" true

success ".env is ready"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Pull latest code from git (skip if no remote)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
if git remote get-url origin &>/dev/null; then
  info "Pulling latest code..."
  git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)" \
    || warn "git pull failed — continuing with current code"
  success "Code up to date"
else
  warn "No git remote — skipping git pull"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Build images sequentially (one at a time to avoid VPS freeze)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
info "Building images one at a time (sequential to protect VPS resources)..."

if $REBUILD; then
  info "Full rebuild requested — stopping existing containers..."
  docker compose down --remove-orphans || true
  docker compose -f infra/docker.compose.yml down --remove-orphans || true
fi

# Build each image individually so pnpm install + compile never overlap
for svc in migrate api worker web; do
  info "  Building $svc..."
  if $REBUILD; then
    docker compose build --no-cache "$svc"
  else
    docker compose build "$svc"
  fi
  success "  $svc built"
done

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5a — Ensure infra (redis, db, minio) is up
# ─────────────────────────────────────────────────────────────────────────────
echo ""
info "Ensuring infra services are up (redis, db, minio)..."
docker compose -f infra/docker.compose.yml --env-file .env up -d
success "Infra up"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5b — Start all containers (images already built, startup is fast)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
info "Starting app containers..."

if $REBUILD; then
  docker compose up -d --force-recreate
else
  docker compose up -d
fi

success "App containers started"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Wait for API to become healthy
# ─────────────────────────────────────────────────────────────────────────────
echo ""
info "Waiting for API to become healthy (up to 2 min)..."
TIMEOUT=120; ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' docsense_api 2>/dev/null || echo "missing")
  [ "$STATUS" = "healthy" ]   && break
  [ "$STATUS" = "unhealthy" ] && { warn "API is unhealthy — check: docker compose logs api"; break; }
  sleep 5; ELAPSED=$((ELAPSED + 5)); echo -n "."
done
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — Print summary
# ─────────────────────────────────────────────────────────────────────────────
APP_URL=$(grep -E "^APP_URL=" .env | cut -d'=' -f2- || echo "http://localhost")
WEB_PORT=$(grep -E "^WEB_PORT=" .env | cut -d'=' -f2- || echo "3000")

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      DocSense is up and running!         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  App         : ${BLUE}${APP_URL}${NC}"
echo -e "  Web port    : ${BLUE}127.0.0.1:${WEB_PORT}${NC}  ← point your host nginx here"
echo -e "  MinIO UI    : ${BLUE}${APP_URL%/}:9001${NC}"
echo ""
echo "  Container status:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
  || docker compose ps
echo ""
echo -e "  Handy commands:"
echo -e "    All logs     : ${YELLOW}docker compose logs -f${NC}"
echo -e "    API logs     : ${YELLOW}docker compose logs -f api${NC}"
echo -e "    Web logs     : ${YELLOW}docker compose logs -f web${NC}"
echo -e "    Stop all     : ${YELLOW}docker compose down && docker compose -f infra/docker.compose.yml down${NC}"
echo -e "    Update app   : ${YELLOW}bash deploy.sh${NC}"
echo -e "    Full rebuild : ${YELLOW}bash deploy.sh --rebuild${NC}"
echo ""
