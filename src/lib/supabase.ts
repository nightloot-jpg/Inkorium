import { createClient } from '@supabase/supabase-js';

// Safe frontend fallback: Supabase publishable keys are intended for browser use.
// Coolify can still override these with VITE_* environment variables at build time.
const SUPABASE_URL = 'https://zllwzmfsfzfedorljgtg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_npJmIHQP_g2ApAu-7fqQAQ_dse7H5Jj';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL).trim();
const supabaseKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  SUPABASE_PUBLISHABLE_KEY
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
