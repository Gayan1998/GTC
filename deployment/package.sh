#!/usr/bin/env bash
#
# Build the frontend and assemble a deployment archive for cPanel shared hosting.
#
# Usage (from anywhere):
#   bash deployment/package.sh
#
# Output: gtc-holdings-deploy.zip in the project root.
#
# The archive contains only what must be uploaded:
#   index.html, assets/, favicon.png, robots.txt, sitemap.php, .htaccess,
#   api/ (without your local config.php or logs), uploads/ (with seed images).
#
# Source folders (frontend/, database/, docs/, deployment/) are excluded.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAGE="$ROOT/.deploy-stage"
ZIP="$ROOT/gtc-holdings-deploy.zip"

echo "==> Building frontend"
(cd frontend && npm run build)

echo "==> Staging files"
rm -rf "$STAGE"
mkdir -p "$STAGE"

cp index.html "$STAGE/"
cp -r assets "$STAGE/"
cp favicon.png robots.txt sitemap.php .htaccess "$STAGE/"

# API: keep the sample config, drop the local config.php and any logs.
mkdir -p "$STAGE/api"
while IFS= read -r -d '' file; do
  rel="${file#./}"
  case "$rel" in
    config/config.php) continue ;;
    *.log) continue ;;
  esac
  mkdir -p "$STAGE/api/$(dirname "$rel")"
  cp "api/$rel" "$STAGE/api/$rel"
done < <(cd api && find . -type f -print0)

# Uploads: keep the directory guard and the seeded images.
mkdir -p "$STAGE/uploads"
while IFS= read -r -d '' file; do
  rel="${file#./}"
  mkdir -p "$STAGE/uploads/$(dirname "$rel")"
  cp "uploads/$rel" "$STAGE/uploads/$rel"
done < <(cd uploads && find . -type f -print0)

# Database scripts, for importing through phpMyAdmin. Blocked from web access
# by the root .htaccess and safe to delete after import.
mkdir -p "$STAGE/database"
cp database/schema.sql database/seed.sql "$STAGE/database/"

echo "==> Creating archive"
rm -f "$ZIP"
STAGE_WIN="$(cygpath -w "$STAGE" 2>/dev/null || echo "$STAGE")"
ZIP_WIN="$(cygpath -w "$ZIP" 2>/dev/null || echo "$ZIP")"
powershell -NoProfile -Command "Compress-Archive -Path '${STAGE_WIN}\\*' -DestinationPath '${ZIP_WIN}' -Force"

rm -rf "$STAGE"

echo "==> Done: $ZIP"
ls -lh "$ZIP"
