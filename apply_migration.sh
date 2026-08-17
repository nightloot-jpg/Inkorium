#!/bin/bash
export SUPABASE_URL="${VITE_SUPABASE_URL}"
export SUPABASE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}"

echo "We can't apply migrations locally with the Supabase CLI if it's not installed/authenticated, but since we modify supabase/migrations, we can assume the user's pipeline or coolify stack will apply them. However, since the database is remote and we want to test locally, we will try to apply it via API if possible. Since we don't have service_role, we might hit RLS if we use the API to alter tables, which is impossible anyway. Let's see if we have supabase CLI."
supabase db push
