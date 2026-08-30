import { createClient } from '@supabase/supabase-js';

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

const profileAwareFetch: typeof fetch = async (input, init) => {
  const request = input instanceof Request ? input : null;
  const requestUrl = typeof input === 'string' ? input : request?.url || String(input);
  const requestMethod = String(init?.method || request?.method || 'GET').toUpperCase();

  try {
    const parsed = new URL(requestUrl);
    const isProfilesRequest =
      parsed.origin === supabaseUrl &&
      parsed.pathname.replace(/\/+$/, '') === '/rest/v1/profiles';

    if (isProfilesRequest && typeof window !== 'undefined') {
      const headers = new Headers(init?.headers || request?.headers || undefined);

      if (requestMethod === 'GET') {
        const proxyUrl = `${window.location.origin}/api/profiles${parsed.search}`;
        return fetch(proxyUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          cache: 'no-store'
        });
      }

      if (requestMethod === 'PATCH') {
        const match = parsed.searchParams.get('id')?.match(/^eq\.(.+)$/);
        let body: any = {};
        const rawBody = init?.body ?? request?.body;
        if (typeof rawBody === 'string') {
          try { body = JSON.parse(rawBody); } catch { body = {}; }
        }
        const presence = typeof body.presence === 'string' ? body.presence : '';
        const authorization = headers.get('authorization') || '';

        if (match && presence && authorization.startsWith('Bearer ')) {
          const proxyUrl = `${window.location.origin}/api/profiles/${encodeURIComponent(match[1])}/presence`;
          return fetch(proxyUrl, {
            method: 'PATCH',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: authorization
            },
            credentials: 'omit',
            body: JSON.stringify({ presence })
          });
        }
      }
    }
  } catch {
    // Fall back to normal Supabase transport for unrelated/malformed requests.
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
        fetch: profileAwareFetch,
      },
    })
  : null;
