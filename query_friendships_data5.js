import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: d2, error: e2 } = await supabase.from('posts').select('visibility').limit(5);
  console.log("posts visibility:", d2);
}

check();
