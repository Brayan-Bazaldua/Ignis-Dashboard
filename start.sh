#!/usr/bin/env bash
# IGNIS - inicialización y arranque del proyecto.
#
# Uso:
#   ./start.sh            # desarrollo: prepara todo y arranca API + frontend
#   ./start.sh setup      # solo prepara dependencias, base de datos y seed
#   ./start.sh docker     # stack completo con Docker Compose
#   ./start.sh stop       # detiene los servicios Docker
#   ./start.sh logs       # sigue los logs del stack Docker
#   ./start.sh status     # muestra el estado de los contenedores
#   ./start.sh reset      # borra contenedores y volúmenes (con confirmación)
#   ./start.sh help       # muestra esta ayuda
#
# En Windows, ejecútalo desde Git Bash o WSL.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

API_PID=""
WEB_PID=""

if [ -t 1 ]; then
  C_RESET=$'\033[0m'
  C_INFO=$'\033[36m'
  C_OK=$'\033[32m'
  C_WARN=$'\033[33m'
  C_ERR=$'\033[31m'
else
  C_RESET=""
  C_INFO=""
  C_OK=""
  C_WARN=""
  C_ERR=""
fi

info() { printf '%s[IGNIS]%s %s\n' "$C_INFO" "$C_RESET" "$*"; }
ok() { printf '%s[ OK ]%s %s\n' "$C_OK" "$C_RESET" "$*"; }
warn() { printf '%s[WARN]%s %s\n' "$C_WARN" "$C_RESET" "$*"; }
error() { printf '%s[ERR ]%s %s\n' "$C_ERR" "$C_RESET" "$*" >&2; }

usage() {
  cat <<'EOF'
IGNIS - inicialización y arranque

  ./start.sh            Desarrollo: prepara dependencias, siembra la base
                        de datos y arranca API + frontend.
  ./start.sh setup      Solo prepara dependencias, base de datos y seed.
  ./start.sh docker     Construye y levanta el stack completo con Docker.
  ./start.sh stop       Detiene los servicios Docker (conserva los datos).
  ./start.sh logs       Sigue los logs del stack de producción.
  ./start.sh status     Muestra el estado de los contenedores.
  ./start.sh reset      Borra contenedores y volúmenes de PostgreSQL.
  ./start.sh help       Muestra esta ayuda.

Variables opcionales:
  PYTHON_BIN=python3.12   Intérprete de Python a usar.
  IGNIS_RELOAD=1          Activa --reload en uvicorn (desarrollo).

Requisitos:
  - Docker Desktop en ejecución.
  - Python 3.12+.
  - Node.js 22+ y npm.

En Windows, ejecuta este script desde Git Bash o WSL.
EOF
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

PROJECT_BASE="$(basename "$ROOT_DIR" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')"
[ -n "$PROJECT_BASE" ] || PROJECT_BASE="ignis"
DEV_PROJECT="${IGNIS_DEV_PROJECT:-${PROJECT_BASE}-dev}"
PROD_PROJECT="${IGNIS_PROD_PROJECT:-$PROJECT_BASE}"

dev_compose() {
  compose -p "$DEV_PROJECT" -f docker-compose.yml "$@"
}

prod_compose() {
  compose -p "$PROD_PROJECT" -f docker-compose.prod.yml "$@"
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    error "Docker no está instalado. Instala Docker Desktop y vuelve a intentarlo."
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    error "Docker no está en ejecución. Abre Docker Desktop y espera a que termine de iniciar."
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    error "Docker Compose no está disponible. Actualiza Docker Desktop o instala docker-compose."
    exit 1
  fi
}

detect_python() {
  if [ -z "${PYTHON_BIN:-}" ]; then
    case "$(uname -s)" in
      MINGW*|MSYS*|CYGWIN*) PYTHON_BIN="python" ;;
      *) PYTHON_BIN="python3" ;;
    esac
  fi

  if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    error "No se encontró Python ($PYTHON_BIN). Instala Python 3.12+ y vuelve a intentarlo."
    exit 1
  fi

  if ! "$PYTHON_BIN" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)' >/dev/null 2>&1; then
    error "Se requiere Python 3.12 o superior. Detectado: $("$PYTHON_BIN" --version 2>&1)"
    exit 1
  fi
}

require_node() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    error "Node.js y npm no están disponibles. Instala Node.js 22+ y vuelve a intentarlo."
    exit 1
  fi

  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [ "$major" -lt 22 ]; then
    warn "Node $(node -v) detectado; el proyecto recomienda Node 22+."
  fi
}

venv_python() {
  if [ -x "$ROOT_DIR/backend/.venv/Scripts/python.exe" ]; then
    printf '%s\n' "$ROOT_DIR/backend/.venv/Scripts/python.exe"
  elif [ -x "$ROOT_DIR/backend/.venv/bin/python" ]; then
    printf '%s\n' "$ROOT_DIR/backend/.venv/bin/python"
  else
    return 1
  fi
}

setup_backend() {
  detect_python

  if ! venv_python >/dev/null 2>&1; then
    info "Creando entorno virtual de Python en backend/.venv ..."
    "$PYTHON_BIN" -m venv "$ROOT_DIR/backend/.venv"
    ok "Entorno virtual creado."
  fi

  local py
  py="$(venv_python)"

  if ! "$py" -m pip --version >/dev/null 2>&1; then
    info "Instalando pip en el entorno virtual..."
    if ! "$py" -m ensurepip --upgrade; then
      error "No se pudo instalar pip en backend/.venv. Elimina la carpeta backend/.venv y vuelve a ejecutar ./start.sh setup."
      exit 1
    fi
  fi

  local req_hash
  req_hash="$("$py" -c "import hashlib, pathlib; print(hashlib.sha256(pathlib.Path('backend/requirements.txt').read_bytes()).hexdigest())")"

  local stamp="$ROOT_DIR/backend/.venv/.ignis-requirements.sha256"
  if [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$req_hash" ]; then
    info "Instalando dependencias del backend..."
    ( cd "$ROOT_DIR/backend" && "$py" -m pip install -r requirements.txt )
    printf '%s\n' "$req_hash" > "$stamp"
    ok "Dependencias del backend instaladas."
  else
    ok "Dependencias del backend al día."
  fi
}

setup_frontend() {
  require_node

  if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
    info "Creando frontend/.env.local ..."
    cat > "$ROOT_DIR/frontend/.env.local" <<'EOF'
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
API_URL=http://127.0.0.1:8000
EOF
    ok "frontend/.env.local creado."
  fi

  local lock_hash stamp
  if [ -f "$ROOT_DIR/frontend/package-lock.json" ]; then
    lock_hash="$(node -e "const c=require('crypto'), f=require('fs'); console.log(c.createHash('sha256').update(f.readFileSync('frontend/package-lock.json')).digest('hex'))")"
  else
    lock_hash="no-lock"
  fi
  stamp="$ROOT_DIR/frontend/node_modules/.ignis-lock.sha256"

  if [ ! -d "$ROOT_DIR/frontend/node_modules" ] || [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$lock_hash" ]; then
    info "Instalando dependencias del frontend..."
    if [ -f "$ROOT_DIR/frontend/package-lock.json" ]; then
      if ! ( cd "$ROOT_DIR/frontend" && npm ci ); then
        warn "npm ci falló; intentando con npm install..."
        ( cd "$ROOT_DIR/frontend" && npm install )
      fi
    else
      ( cd "$ROOT_DIR/frontend" && npm install )
    fi
    printf '%s\n' "$lock_hash" > "$stamp"
    ok "Dependencias del frontend instaladas."
  else
    ok "Dependencias del frontend al día."
  fi
}

start_db() {
  require_docker

  info "Iniciando PostgreSQL de desarrollo en localhost:5433 ..."
  if prod_compose ps --services --filter status=running 2>/dev/null | grep -q '^db$'; then
    info "Deteniendo el stack de producción para liberar el puerto 5433 ..."
    prod_compose down
  fi
  if ! dev_compose up -d db; then
    error "No se pudo iniciar PostgreSQL. Revisa el estado con ./start.sh status."
    exit 1
  fi

  info "Esperando a que PostgreSQL esté listo..."
  local i
  for i in {1..60}; do
    if dev_compose exec -T db pg_isready -U ignis -d ignis >/dev/null 2>&1; then
      ok "PostgreSQL listo."
      return 0
    fi
    sleep 1
  done

  error "PostgreSQL no respondió en 60 s. Revisa el estado con ./start.sh status."
  exit 1
}

seed_db() {
  local py
  py="$(venv_python)"
  info "Sembrando la base de datos con el snapshot de IGNIS..."
  ( cd "$ROOT_DIR/backend" && "$py" scripts/seed.py )
  ok "Base de datos sembrada."
}

setup_all() {
  require_docker
  setup_backend
  setup_frontend
  start_db
  seed_db
}

api_healthy() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "http://127.0.0.1:8000/api/health" >/dev/null 2>&1
  else
    "$(venv_python)" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=2)" >/dev/null 2>&1
  fi
}

start_api() {
  local py reload_flag
  py="$(venv_python)"
  reload_flag=""
  if [ "${IGNIS_RELOAD:-0}" = "1" ]; then
    reload_flag="--reload"
  fi

  info "Iniciando API en http://127.0.0.1:8000 ..."
  ( cd "$ROOT_DIR/backend" && exec "$py" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 $reload_flag ) &
  API_PID=$!
}

wait_for_api() {
  local i
  for i in {1..60}; do
    if api_healthy; then
      return 0
    fi
    if ! kill -0 "$API_PID" 2>/dev/null; then
      return 1
    fi
    sleep 1
  done
  return 1
}

start_web() {
  info "Iniciando frontend en http://localhost:3000 ..."
  ( cd "$ROOT_DIR/frontend" && exec npm run dev ) &
  WEB_PID=$!
}

web_ready() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "http://localhost:3000/es" >/dev/null 2>&1
  else
    "$(venv_python)" -c "import urllib.request; urllib.request.urlopen('http://localhost:3000/es', timeout=2)" >/dev/null 2>&1
  fi
}

wait_for_web() {
  local i
  for i in {1..120}; do
    if web_ready; then
      return 0
    fi
    if ! kill -0 "$WEB_PID" 2>/dev/null; then
      return 1
    fi
    sleep 1
  done
  return 1
}

# Termina un proceso y todos sus descendientes.
# En Windows, npm y Next crean un árbol de procesos; taskkill /T lo cierra completo.
kill_tree() {
  local pid="$1"
  [ -n "$pid" ] || return 0

  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
      local winpid
      winpid="$(cat "/proc/$pid/winpid" 2>/dev/null || true)"
      if [ -n "$winpid" ] && command -v taskkill >/dev/null 2>&1; then
        taskkill //PID "$winpid" //T //F >/dev/null 2>&1 || true
      else
        kill -9 "$pid" 2>/dev/null || true
      fi
      return 0
      ;;
  esac

  local child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}

cleanup() {
  trap - INT TERM

  info "Deteniendo servidores..."
  if [ -n "${API_PID:-}" ]; then
    kill_tree "$API_PID"
  fi
  if [ -n "${WEB_PID:-}" ]; then
    kill_tree "$WEB_PID"
  fi

  sleep 1

  if [ -n "${API_PID:-}" ]; then
    kill -9 "$API_PID" 2>/dev/null || true
  fi
  if [ -n "${WEB_PID:-}" ]; then
    kill -9 "$WEB_PID" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
  ok "Servidores detenidos. PostgreSQL sigue en marcha."
}

run_dev() {
  setup_all

  trap 'cleanup; exit 130' INT TERM
  start_api

  if ! wait_for_api; then
    error "La API no arrancó correctamente. Revisa los mensajes anteriores."
    cleanup
    exit 1
  fi
  ok "API lista."

  start_web

  if ! wait_for_web; then
    error "El frontend no arrancó correctamente. Revisa los mensajes anteriores."
    cleanup
    exit 1
  fi
  ok "Frontend listo."

  cat <<EOF

  IGNIS está en marcha:
    Frontend:  http://localhost:3000
    API:       http://127.0.0.1:8000
    Docs API:  http://127.0.0.1:8000/docs

  Pulsa Ctrl+C para detener los servidores.
  PostgreSQL seguirá en marcha; usa ./start.sh stop para detenerlo.

EOF

  while kill -0 "$API_PID" 2>/dev/null && kill -0 "$WEB_PID" 2>/dev/null; do
    sleep 1
  done

  cleanup
}

run_docker() {
  require_docker

  local prod_running
  prod_running="$(prod_compose ps --services --filter status=running 2>/dev/null || true)"

  if command -v curl >/dev/null 2>&1; then
    if ! printf '%s\n' "$prod_running" | grep -q '^api$'; then
      if curl -fsS "http://127.0.0.1:8000/api/health" >/dev/null 2>&1; then
        error "La API de desarrollo sigue corriendo en el puerto 8000. Detén ./start.sh dev con Ctrl+C antes de usar el modo Docker."
        exit 1
      fi
    fi
    if ! printf '%s\n' "$prod_running" | grep -q '^web$'; then
      if curl -fsS "http://127.0.0.1:3000" >/dev/null 2>&1; then
        error "El frontend de desarrollo sigue corriendo en el puerto 3000. Detén ./start.sh dev con Ctrl+C antes de usar el modo Docker."
        exit 1
      fi
    fi
  fi

  if dev_compose ps --services --filter status=running 2>/dev/null | grep -q '^db$'; then
    info "Deteniendo la base de datos de desarrollo para liberar el puerto 5433 ..."
    dev_compose down
  fi

  info "Construyendo y levantando el stack completo con Docker..."
  if ! prod_compose up -d --build; then
    error "No se pudo levantar el stack. Revisa el estado con ./start.sh status."
    exit 1
  fi

  ok "Stack levantado."
  cat <<EOF

  IGNIS está en marcha:
    Frontend:  http://localhost:3000
    API:       http://127.0.0.1:8000
    Docs API:  http://127.0.0.1:8000/docs

  Logs:  ./start.sh logs
  Stop:  ./start.sh stop

EOF
}

run_stop() {
  require_docker

  info "Deteniendo stack de producción..."
  prod_compose down || true

  info "Deteniendo base de datos de desarrollo..."
  dev_compose down || true

  ok "Servicios Docker detenidos. Los volúmenes de datos se conservan."
}

run_logs() {
  require_docker
  prod_compose logs -f --tail=100
}

run_status() {
  require_docker

  info "Stack de producción:"
  prod_compose ps || true

  info "Base de datos de desarrollo:"
  dev_compose ps || true
}

run_reset() {
  require_docker

  warn "Esto eliminará los contenedores y los volúmenes de PostgreSQL."
  read -r -p "¿Continuar? [s/N] " answer
  case "$answer" in
    s|S|si|SI|sí|SÍ) ;;
    *)
      info "Cancelado."
      exit 0
      ;;
  esac

  prod_compose down -v || true
  dev_compose down -v || true
  ok "Datos eliminados. La próxima ejecución volverá a sembrar la base."
}

case "${1:-dev}" in
  dev|start)
    run_dev
    ;;
  setup)
    setup_all
    ok "Proyecto inicializado. Ejecuta ./start.sh dev para arrancar."
    ;;
  docker|prod)
    run_docker
    ;;
  stop|down)
    run_stop
    ;;
  logs)
    run_logs
    ;;
  status|ps)
    run_status
    ;;
  reset)
    run_reset
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    error "Comando desconocido: $1"
    usage
    exit 1
    ;;
esac
