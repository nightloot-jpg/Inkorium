#!/usr/bin/env bash
# Runs the migrate-storage-to-r2 function to completion for one bucket, paging
# through results until "done":true.
#
# Usage:
#   MIGRATION_ADMIN_SECRET=xxx FUNCTION_URL=https://<project>.supabase.co/functions/v1/migrate-storage-to-r2 \
#     ./run_migration.sh post-media --dry-run
#   MIGRATION_ADMIN_SECRET=xxx FUNCTION_URL=https://<project>.supabase.co/functions/v1/migrate-storage-to-r2 \
#     ./run_migration.sh post-media --write
#
# Repeat for music-media and photos.

set -euo pipefail

BUCKET="${1:?Uso: run_migration.sh <post-media|music-media|photos> [--dry-run|--write]}"
MODE="${2:---dry-run}"

if [[ -z "${MIGRATION_ADMIN_SECRET:-}" ]]; then echo "Falta MIGRATION_ADMIN_SECRET" >&2; exit 1; fi
if [[ -z "${FUNCTION_URL:-}" ]]; then echo "Falta FUNCTION_URL" >&2; exit 1; fi

DRY_RUN="true"
if [[ "$MODE" == "--write" ]]; then DRY_RUN="false"; fi

OFFSET=0
LIMIT=20
TOTAL_MIGRATED=0
TOTAL_ERRORS=0

while true; do
  RESPONSE=$(curl -sS -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d "{\"secret\":\"$MIGRATION_ADMIN_SECRET\",\"bucket\":\"$BUCKET\",\"offset\":$OFFSET,\"limit\":$LIMIT,\"dryRun\":$DRY_RUN}")

  echo "$RESPONSE" | python3 -m json.tool

  DONE=$(echo "$RESPONSE" | python3 -c "import json,sys;print(json.load(sys.stdin).get('done'))")
  NEXT=$(echo "$RESPONSE" | python3 -c "import json,sys;print(json.load(sys.stdin).get('nextOffset'))")
  MIGRATED=$(echo "$RESPONSE" | python3 -c "import json,sys;d=json.load(sys.stdin);print(sum(1 for r in d.get('results',[]) if r['status'] in ('migrated','would-migrate')))")
  ERRORS=$(echo "$RESPONSE" | python3 -c "import json,sys;d=json.load(sys.stdin);print(sum(1 for r in d.get('results',[]) if r['status']=='error'))")
  TOTAL_MIGRATED=$((TOTAL_MIGRATED + MIGRATED))
  TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))

  if [[ "$DONE" == "True" || "$DONE" == "true" ]]; then break; fi
  OFFSET="$NEXT"
done

echo "Terminado. Bucket=$BUCKET dryRun=$DRY_RUN migrados/simulados=$TOTAL_MIGRATED errores=$TOTAL_ERRORS"
