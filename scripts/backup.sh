#!/bin/bash
# ─── DOTE 2.0 — MySQL Backup Script ─────────────────────────────────────────────
# Runs inside the dote_db container to create timestamped SQL dumps.
#
# Usage (manual):
#   chmod +x scripts/backup.sh
#   ./scripts/backup.sh
#
# Usage (cron — daily at 2 AM):
#   crontab -e
#   0 2 * * * /opt/dote/scripts/backup.sh >> /opt/dote/backups/backup.log 2>&1

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER_NAME="${CONTAINER_NAME:-dote_db}"
DB_NAME="${DB_NAME:-admission_dote}"
DB_USER="${DB_USER:-root}"
DB_PASS="${MYSQL_ROOT_PASSWORD:-rootpassword}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# ─── Ensure backup directory exists ──────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ─── Generate timestamp ─────────────────────────────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "═══════════════════════════════════════════════════════════════"
echo "  DOTE 2.0 — Database Backup"
echo "  Time: $(date)"
echo "  Target: ${BACKUP_FILE}"
echo "═══════════════════════════════════════════════════════════════"

# ─── Execute backup ─────────────────────────────────────────────────────────
docker exec "$CONTAINER_NAME" \
  mysqldump -u"$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --add-drop-table \
  --complete-insert \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

# ─── Verify ─────────────────────────────────────────────────────────────────
if [ -s "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup successful: $BACKUP_FILE ($SIZE)"
else
  echo "❌ Backup failed: File is empty or missing!"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ─── Cleanup old backups ────────────────────────────────────────────────────
echo "🧹 Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
echo "   Backups remaining: $REMAINING"

echo "═══════════════════════════════════════════════════════════════"
echo "  Backup complete."
echo "═══════════════════════════════════════════════════════════════"
