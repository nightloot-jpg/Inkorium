#!/bin/bash
source .env
curl -s -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" "${VITE_SUPABASE_URL}/rest/v1/posts?select=*&limit=5"
