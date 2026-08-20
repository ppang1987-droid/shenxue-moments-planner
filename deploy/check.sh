#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
docker compose --env-file .env.production ps
docker compose --env-file .env.production exec -T app wget -qO- http://127.0.0.1:3000/ >/dev/null
echo "应用容器访问正常。"

if [[ -f .env.production ]]; then
  set -a
  source .env.production
  set +a
  CHECK_URL="${SITE_ADDRESS}"
  if [[ "${CHECK_URL}" != http://* && "${CHECK_URL}" != https://* ]]; then
    CHECK_URL="https://${CHECK_URL}"
  fi
  curl -fsSIL --max-time 20 "${CHECK_URL}" | head -n 1 || true
fi
