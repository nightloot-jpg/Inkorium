import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function check() {
  const response = await fetch(`${url}/rest/v1/friendships?limit=1`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation'
    },
    method: 'OPTIONS'
  });
  console.log([...response.headers.entries()]);
}

check();
