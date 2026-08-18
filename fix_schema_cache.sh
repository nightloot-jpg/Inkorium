curl -X POST "${VITE_SUPABASE_URL}/rest/v1/rpc/reload_schema_cache" \
-H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
-H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}"
