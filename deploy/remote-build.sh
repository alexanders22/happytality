#!/usr/bin/env bash
# Remote-only half of deploy (run ON the VPS or via: bash deploy/deploy.sh remote-only from CI).
# When invoked as `deploy.sh` without sync from a machine that has the tree at APP_DIR, use remote-only.
set -euo pipefail

# If first arg is remote-only, skip rsync (CI already synced).
if [[ "${1:-}" == "remote-only" ]]; then
  :
fi

# This file is the full script — keep single source in deploy.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
# Re-exec the main deploy in remote-only mode when called from Actions oddly
if [[ "${1:-}" == "remote-only" && -z "${HAPPYTALITY_REMOTE_BUILD:-}" ]]; then
  export HAPPYTALITY_REMOTE_BUILD=1
  cd /var/www/happytality
  # inline build (same as deploy.sh REMOTE block) — keep in sync with deploy.sh
  set -euo pipefail
  mkdir -p /var/www/certbot backend/storage/framework/{cache,sessions,views} backend/storage/logs backend/bootstrap/cache

  PHP_SOCK=""
  for s in /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php-fpm.sock; do
    if [[ -S "$s" ]]; then PHP_SOCK="$s"; break; fi
  done
  if [[ -n "$PHP_SOCK" && -f deploy/nginx.happytality.co.conf ]]; then
    sed -i "s|/run/php/php8.3-fpm.sock|${PHP_SOCK}|g" deploy/nginx.happytality.co.conf
  fi

  if [[ ! -f backend/.env ]]; then
    echo "ERROR: backend/.env missing on server."
    exit 1
  fi

  cat > frontend/.env.production <<'EOF'
VITE_API_BASE_URL=https://happytality.co/api/v1
EOF

  (cd backend && composer install --no-dev --optimize-autoloader --no-interaction)
  (cd frontend && npm ci && npm run build)
  (cd backend && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan storage:link 2>/dev/null || true)

  cp -f deploy/nginx.happytality.co.conf /etc/nginx/conf.d/happytality.co.conf
  nginx -t && systemctl reload nginx
  curl -s -o /dev/null -w "http_root:%{http_code}\n" -H "Host: happytality.co" http://127.0.0.1/ || true
  curl -s -o /dev/null -w "http_api:%{http_code}\n" -H "Host: happytality.co" http://127.0.0.1/api/v1/meta/locales || true
  exit 0
fi

echo "Use: ./deploy/deploy.sh          # rsync + remote build from laptop"
echo "  or: ./deploy/deploy.sh remote-only  # on VPS / after CI rsync"
exit 1
