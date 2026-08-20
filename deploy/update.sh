#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
git pull --ff-only
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
