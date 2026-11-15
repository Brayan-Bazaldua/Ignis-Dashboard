#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ignis}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Falta $ENV_FILE. Copia .env.prod.example y completa los valores."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "Construyendo y levantando IGNIS en modo produccion..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo "Estado de los contenedores:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo "Listo. Verifica https://${DOMAIN:-ignis.tudominio.com}"
