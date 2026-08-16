#!/bin/bash
source .env
psql -U postgres -h aws-0-us-west-1.pooler.supabase.com -p 6543 -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
