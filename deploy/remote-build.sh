#!/usr/bin/env bash
# Run ON the VPS at /var/www/happytality (after git/rsync sync).
# Invoked by deploy/deploy.sh and by GitHub Actions.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p /var/www/certbot \
  backend/storage/framework/{cache,sessions,views} \
  backend/storage/logs \
  backend/bootstrap/cache

PHP_SOCK=""
for s in /run/php/php8.3-fpm.sock /run/php/php8.2-fpm.sock /run/php/php-fpm.sock; do
  if [[ -S "$s" ]]; then PHP_SOCK="$s"; break; fi
done
if [[ -n "$PHP_SOCK" && -f deploy/nginx.happytality.co.conf ]]; then
  sed -i "s|/run/php/php8.3-fpm.sock|${PHP_SOCK}|g" deploy/nginx.happytality.co.conf
fi

if [[ ! -f backend/.env ]]; then
  echo "ERROR: backend/.env missing on server. Create once with APP_KEY, DB_*, FRONTEND_URL=https://happytality.co, SANCTUM_STATEFUL_DOMAINS=happytality.co,www.happytality.co"
  exit 1
fi

cat > frontend/.env.production <<'EOF'
VITE_API_BASE_URL=https://happytality.co/api/v1
EOF

echo "==> Composer"
(cd backend && composer install --no-dev --optimize-autoloader --no-interaction)

echo "==> Frontend build"
(cd frontend && npm ci && npm run build)

echo "==> Laravel migrate + cache"
(cd backend && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan storage:link 2>/dev/null || true)

echo "==> nginx"
cp -f deploy/nginx.happytality.co.conf /etc/nginx/conf.d/happytality.co.conf
nginx -t && systemctl reload nginx

curl -s -o /dev/null -w "http_root:%{http_code}\n" -H "Host: happytality.co" http://127.0.0.1/ || true
curl -s -o /dev/null -w "http_api:%{http_code}\n" -H "Host: happytality.co" http://127.0.0.1/api/v1/meta/locales || true
echo "==> remote-build done"
