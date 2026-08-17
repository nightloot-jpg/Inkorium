import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: d2, error: e2 } = await supabase.from('friendships').select('requester_id').limit(1);
  console.log("requester_id:", e2);
  const { data: d3, error: e3 } = await supabase.from('friendships').select('addressee_id').limit(1);
  console.log("addressee_id:", e3);
  const { data: d4, error: e4 } = await supabase.from('friendships').select('user1').limit(1);
  console.log("user1:", e4);
  const { data: d5, error: e5 } = await supabase.from('friendships').select('user2').limit(1);
  console.log("user2:", e5);
}

check();
