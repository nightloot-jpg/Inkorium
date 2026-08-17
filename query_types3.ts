import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: f2, error: e2 } = await supabase.from('friendships').select().limit(0);
  console.log("friendships query ok", e2);

  if (!e2) {
    const response = await fetch(`${url}/rest/v1/friendships?limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log(await response.json());
  }
}

check();
