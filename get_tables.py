import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()
supabase_url = os.environ.get('VITE_SUPABASE_URL')
api_key = os.environ.get('VITE_SUPABASE_PUBLISHABLE_KEY')

req = urllib.request.Request(f"{supabase_url}/rest/v1/?apikey={api_key}", headers={
    'apikey': api_key,
    'Authorization': f"Bearer {api_key}"
})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(list(data['definitions'].keys()), indent=2))
except Exception as e:
    print(f"Error: {e}")
