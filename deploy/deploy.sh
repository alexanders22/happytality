#!/usr/bin/env bash
# Deploy Happytality to Hostinger VPS (same host as NeuroKali: 148.230.71.98).
# Prefer git push → GitHub Actions (.github/workflows/deploy.yml).
# This script: rsync from laptop + remote build. Secrets stay on the server.
set -euo pipefail

REMOTE="${REMOTE:-root@148.230.71.98}"
APP_DIR="${APP_DIR:-/var/www/happytality}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Sync source → ${REMOTE}:${APP_DIR}"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'frontend/node_modules' \
  --exclude 'backend/vendor' \
  --exclude 'backend/node_modules' \
  --exclude 'frontend/dist' \
  --exclude 'backend/.env' \
  --exclude 'frontend/.env' \
  --exclude 'frontend/.env.*' \
  "${ROOT}/" "${REMOTE}:${APP_DIR}/"

echo "==> Remote build"
ssh "${REMOTE}" "cd ${APP_DIR} && bash deploy/remote-build.sh"

echo "==> Done. SSL (once DNS is live):"
echo "  ssh ${REMOTE} \"certbot --nginx -d happytality.co -d www.happytality.co --non-interactive --agree-tos -m admin@happytality.co --redirect\""
