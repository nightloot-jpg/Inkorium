import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: d2, error: e2 } = await supabase.from('friendships').select('id, created_at, status, requester_id, addressee_id').limit(1);
  console.log("friendships columns:", e2 ? e2.message : "Success");
}

check();
