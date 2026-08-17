#!/bin/bash
source .env
curl -s -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" "${VITE_SUPABASE_URL}/rest/v1/friendships?select=*&limit=1"
echo ""
curl -s -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" "${VITE_SUPABASE_URL}/rest/v1/friends?select=*&limit=1"
echo ""
curl -s -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" "${VITE_SUPABASE_URL}/rest/v1/relationships?select=*&limit=1"
echo ""
