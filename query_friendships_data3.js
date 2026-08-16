import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: d2, error: e2 } = await supabase.from('post_visibility_users').select('*').limit(1);
  console.log("post_visibility_users:", e2);
}

check();
