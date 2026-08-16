import subprocess
import os

supabase_url = os.environ.get('VITE_SUPABASE_URL')
# Parse pooler url from supabase_url
pooler_host = supabase_url.replace("https://", "").replace(".supabase.co", ".pooler.supabase.com")
# We don't have db password, this probably won't work
