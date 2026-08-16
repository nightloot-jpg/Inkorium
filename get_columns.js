import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.rpc('get_friendships_schema_or_something');
  // Just querying empty row is ok
  const { data: d2, error: e2 } = await supabase.from('friendships').select('*').limit(1);
  console.log("Empty data means table exists but no rows:", d2);
  
  // Try inserting valid UUID to see if we get column not-null constraints
  const { error: e3 } = await supabase.from('friendships').insert({ id: '00000000-0000-0000-0000-000000000000' });
  console.log("Insert error helps find columns:", e3);
}

check();
