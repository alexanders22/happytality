#!/usr/bin/env bash
# Deploy Happytality to Hostinger VPS (same host as NeuroKali).
# Prefer: git push → GitHub Actions (see .github/workflows/deploy.yml).
# This script is the remote build step (also invoked by CI after rsync/checkout).
# Secrets stay on the server — never commit backend/.env or SSH keys.
set -euo pipefail

REMOTE="${REMOTE:-root@148.230.71.98}"
APP_DIR="${APP_DIR:-/var/www/happytality}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-sync}" # sync | remote-only

if [[ "$MODE" == "sync" ]]; then
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
fi

echo "==> Remote install / build / migrate / nginx"
ssh "${REMOTE}" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/happytality
mkdir -p /var/www/certbot backend/storage/framework/{cache,sessions,views} backend/storage/logs backend/bootstrap/cache

# PHP-FPM socket: adjust if host uses another version
PHP_SOCK=""
for s in /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php-fpm.sock; do
  if [[ -S "$s" ]]; then PHP_SOCK="$s"; break; fi
done
if [[ -n "$PHP_SOCK" ]]; then
  sed -i "s|/run/php/php8.3-fpm.sock|${PHP_SOCK}|g" deploy/nginx.happytality.co.conf
fi

if [[ ! -f backend/.env ]]; then
  echo "ERROR: backend/.env missing on server. Create it once (APP_KEY, DB_*, FRONTEND_URL=https://happytality.co)."
  exit 1
fi

# Frontend production API (same origin via nginx /api)
cat > frontend/.env.production <<'EOF'
VITE_API_BASE_URL=https://happytality.co/api/v1
EOF

echo "==> Composer"
(cd backend && composer install --no-dev --optimize-autoloader --no-interaction)

echo "==> Frontend build"
(cd frontend && npm ci && npm run build)

echo "==> Laravel"
(cd backend && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan storage:link 2>/dev/null || true)

# SPA + API via nginx: also expose Laravel public for /api
# Ensure API requests hit Laravel — copy/symlink index routing is in nginx conf
cp -f deploy/nginx.happytality.co.conf /etc/nginx/conf.d/happytality.co.conf
nginx -t && systemctl reload nginx

curl -s -o /dev/null -w "http_root:%{http_code}\n" -H "Host: happytality.co" http://127.0.0.1/ || true
curl -s -o /dev/null -w "http_api:%{http_code}\n" -H "Host: happytality.co" http://127.0.0.1/api/v1/meta/locales || true
REMOTE

echo "==> Done. After DNS A→148.230.71.98, run certbot once:"
echo "    ssh ${REMOTE} \"certbot --nginx -d happytality.co -d www.happytality.co --non-interactive --agree-tos -m admin@happytality.co --redirect\""
