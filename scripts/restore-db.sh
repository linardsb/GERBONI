#!/bin/bash
set -euo pipefail

# Database restore script for GERBONI
# Restores from a pg_dump custom-format backup
#
# Usage:
#   ./restore-db.sh <backup_file>
#   ./restore-db.sh /backups/latest.dump
#
# Required env vars:
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "  e.g. $0 /backups/gerboni_2026-02-08_02-00.dump"
    echo "  e.g. $0 /backups/latest.dump"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo ""
echo "=== GERBONI Database Restore ==="
echo "Backup file: ${BACKUP_FILE} (${FILESIZE})"
echo "Target:      ${PGUSER}@${PGHOST}/${PGDATABASE}"
echo ""
echo "WARNING: This will replace all data in the ${PGDATABASE} database."
echo ""

read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Restoring database..."
if pg_restore --clean --if-exists -d "${PGDATABASE}" "${BACKUP_FILE}"; then
    echo "Restore completed successfully."
else
    echo "WARNING: Restore completed with some errors (this is normal for --clean on a fresh database)."
fi

echo ""
echo "Verifying restore..."
TABLE_COUNT=$(psql -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Tables in database: ${TABLE_COUNT}"

USER_COUNT=$(psql -t -c "SELECT count(*) FROM users;" 2>/dev/null || echo "N/A")
echo "Users: ${USER_COUNT}"

ORDER_COUNT=$(psql -t -c "SELECT count(*) FROM orders;" 2>/dev/null || echo "N/A")
echo "Orders: ${ORDER_COUNT}"

echo ""
echo "Restore complete."
