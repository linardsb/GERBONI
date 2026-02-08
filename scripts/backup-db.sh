#!/bin/bash
set -euo pipefail

# Database backup script for GERBONI
# Runs pg_dump with custom format, rotates old backups
#
# Required env vars (set by docker-compose):
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE
#
# Optional env vars:
#   BACKUP_DIR    - where to store backups (default: /backups)
#   RETENTION     - days to keep backups (default: 30)
#   AWS_S3_BUCKET - if set, uploads to S3 after dump

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION="${RETENTION:-30}"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
BACKUP_FILE="${BACKUP_DIR}/gerboni_${TIMESTAMP}.dump"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump
log "Starting backup to ${BACKUP_FILE}"
if pg_dump -Fc -f "${BACKUP_FILE}"; then
    FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Backup completed: ${BACKUP_FILE} (${FILESIZE})"
else
    log "ERROR: pg_dump failed"
    exit 1
fi

# Verify backup is not empty (minimum 1KB)
BYTES=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null)
if [ "${BYTES}" -lt 1024 ]; then
    log "ERROR: Backup file is suspiciously small (${BYTES} bytes)"
    exit 1
fi

# Upload to S3 if configured
if [ -n "${AWS_S3_BUCKET:-}" ]; then
    log "Uploading to s3://${AWS_S3_BUCKET}/backups/"
    if aws s3 cp "${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/backups/$(basename "${BACKUP_FILE}")"; then
        log "S3 upload complete"
    else
        log "WARNING: S3 upload failed (local backup preserved)"
    fi
fi

# Prune old backups
log "Pruning backups older than ${RETENTION} days"
DELETED=$(find "${BACKUP_DIR}" -name "gerboni_*.dump" -mtime "+${RETENTION}" -delete -print | wc -l)
log "Removed ${DELETED} old backup(s)"

# Create symlink to latest
ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/latest.dump"

log "Backup complete"
