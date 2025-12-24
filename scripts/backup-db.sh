#!/bin/bash
timestamp=$(date +%Y%m%d-%H%M%S)
backup_file="luxecut-backup-$timestamp.sql"

echo "Creating database backup..."
# Using supabase CLI to dump the database
supabase db dump > backups/$backup_file

# Verify backup integrity
if [ -f "backups/$backup_file" ] && [ -s "backups/$backup_file" ]; then
  echo "✅ Backup created: backups/$backup_file"
else
  echo "❌ Backup verification failed"
  exit 1
fi