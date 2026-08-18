import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("VITE_SUPABASE_DB_URL")
if not DB_URL:
    print("No VITE_SUPABASE_DB_URL found in .env")
    exit(1)

with open('supabase/migrations/20260822000000_music_system.sql', 'r') as f:
    sql = f.read()

try:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    print("Migration applied successfully!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
