import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()
supabase_url = os.environ.get('VITE_SUPABASE_URL')
api_key = os.environ.get('VITE_SUPABASE_PUBLISHABLE_KEY')

req = urllib.request.Request(f"{supabase_url}/rest/v1/friendships", headers={
    'apikey': api_key,
    'Authorization': f"Bearer {api_key}",
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}, method='POST', data=json.dumps({"invalid_column_name": "test"}).encode())

try:
    with urllib.request.urlopen(req) as response:
        print(response.read())
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
