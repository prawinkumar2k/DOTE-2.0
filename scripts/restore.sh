#!/bin/bash
# ─── DOTE 2.0 — Restore from Backup ─────────────────────────────────────────────
# Usage:
#   ./scripts/restore.sh backups/admission_dote_20260424_020000.sql.gz

set -euo pipefail

BACKUP_FILE="${1:-}"
CONTAINER_NAME="${CONTAINER_NAME:-dote_db}"
DB_NAME="${DB_NAME:-admission_dote}"
DB_USER="${DB_USER:-root}"
DB_PASS="${MYSQL_ROOT_PASSWORD:-rootpassword}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Available backups:"
  ls -lh backups/*.sql.gz 2>/dev/null || echo "  No backups found."
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ File not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will REPLACE the current database!"
echo "   Database: $DB_NAME"
echo "   Backup: $BACKUP_FILE"
read -p "   Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "🔄 Restoring..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" \
  mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"

echo "✅ Database restored successfully from: $BACKUP_FILE"
