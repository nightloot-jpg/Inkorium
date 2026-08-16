#!/bin/bash
source .env

psql -U postgres -h aws-0-us-west-1.pooler.supabase.com -p 6543 -d postgres -c "\dt public.*"
