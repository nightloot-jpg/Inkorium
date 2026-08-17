import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: d2, error: e2 } = await supabase.from('friendships').select('user1_id').limit(1);
  console.log("user1_id:", e2);
  const { data: d3, error: e3 } = await supabase.from('friendships').select('user_id_1').limit(1);
  console.log("user_id_1:", e3);
  const { data: d4, error: e4 } = await supabase.from('friendships').select('user_id').limit(1);
  console.log("user_id:", e4);
  const { data: d5, error: e5 } = await supabase.from('friendships').select('friend_id').limit(1);
  console.log("friend_id:", e5);
  const { data: d6, error: e6 } = await supabase.from('friendships').select('status').limit(1);
  console.log("status:", e6);
}

check();
