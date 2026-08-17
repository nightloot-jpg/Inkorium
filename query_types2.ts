import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: f2, error: e2 } = await supabase.from('friend_requests').select('*').limit(1);
  console.log("friend_requests", f2, e2);
}

check();
