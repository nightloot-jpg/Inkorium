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

const browserFetch: typeof fetch = async (input, init) => {
  const requestUrl = typeof input === 'string'
    ? input
    : input instanceof Request
      ? input.url
      : String(input);

  try {
    const parsed = new URL(requestUrl);
    const isProfilesRestRequest =
      parsed.origin === supabaseUrl &&
      parsed.pathname.replace(/\/+$/, '') === '/rest/v1/profiles';

    if (isProfilesRestRequest && typeof window !== 'undefined') {
      const proxyUrl = `${window.location.origin}/api/profiles${parsed.search}`;
      // Do not forward Supabase auth/apikey/session headers to the same-origin proxy.
      // The proxy authenticates server-side using the configured publishable key.
      return fetch(proxyUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      });
    }
  } catch {
    // Fall through to the normal Supabase request for malformed/non-URL inputs.
  }

  return fetch(input, init);
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: browserFetch,
      },
    })
  : null;
