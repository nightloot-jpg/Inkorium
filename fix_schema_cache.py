from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
url: str = os.getenv("VITE_SUPABASE_URL")
key: str = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(url, key)
response = supabase.table("user_videos").select("*").limit(1).execute()
print(response)
