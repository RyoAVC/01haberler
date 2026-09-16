#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL ortam degiskeni tanimli degil. .env dosyanizi yukleyin." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUT_FILE="$BACKUP_DIR/01haberler-$TIMESTAMP.sql.gz"

echo "Yedek aliniyor: $OUT_FILE"
pg_dump "$DATABASE_URL" | gzip > "$OUT_FILE"
echo "Tamamlandi."
echo ""
echo "Geri yuklemek icin:"
echo "  gunzip -c $OUT_FILE | psql \"\$DATABASE_URL\""
