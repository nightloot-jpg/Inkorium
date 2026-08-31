import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zllwzmfsfzfedorljgtg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_npJmIHQP_g2ApAu-7fqQAQ_dse7H5Jj';
const PRIVATE_MESSAGES_PATH = '/api/private-messages';

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

let supabase: ReturnType<typeof createClient> | null = null;

const profileAwareFetch: typeof fetch = async (input, init) => {
  const request = input instanceof Request ? input : null;
  const requestUrl = typeof input === 'string' ? input : request?.url || String(input);
  const requestMethod = String(init?.method || request?.method || 'GET').toUpperCase();

  try {
    const parsed = new URL(requestUrl);
    const isProfilesRequest =
      parsed.origin === supabaseUrl &&
      parsed.pathname.replace(/\/+$/, '') === '/rest/v1/profiles';
    const isPrivateMessagesRequest =
      parsed.origin === supabaseUrl &&
      parsed.pathname.replace(/\/+$/, '') === '/rest/v1/private_messages';

    if (isPrivateMessagesRequest && typeof window !== 'undefined') {
      const headers = new Headers(init?.headers || request?.headers || undefined);
      const proxyUrl = `${window.location.origin}${PRIVATE_MESSAGES_PATH}${parsed.search}`;
      let body: BodyInit | undefined = init?.body;

      if (body === undefined && request && requestMethod !== 'GET' && requestMethod !== 'HEAD') {
        try {
          body = await request.clone().arrayBuffer();
        } catch {
          body = undefined;
        }
      }

      return fetch(proxyUrl, {
        method: requestMethod,
        headers: {
          Authorization: headers.get('authorization') || '',
          Accept: headers.get('accept') || 'application/json',
          'Content-Type': headers.get('content-type') || 'application/json',
          Prefer: headers.get('prefer') || '',
          'X-Client-Info': headers.get('x-client-info') || ''
        },
        credentials: 'same-origin',
        body
      });
    }

    if (isProfilesRequest && typeof window !== 'undefined') {
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
        const headers = new Headers(init?.headers || request?.headers || undefined);
        const queryId = parsed.searchParams.get('id') || '';
        const match = queryId.match(/^eq\.(.+)$/);

        let rawBody = '';
        try {
          if (typeof init?.body === 'string') {
            rawBody = init.body;
          } else if (request) {
            rawBody = await request.clone().text();
          }
        } catch {
          rawBody = '';
        }

        let body: Record<string, unknown> = {};
        try {
          body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          body = {};
        }

        const presence = typeof body.presence === 'string' ? body.presence.trim().toLowerCase() : '';
        const authorization = headers.get('authorization') || '';

        if (
          match &&
          presence &&
          ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presence)
        ) {
          let accessToken = authorization.startsWith('Bearer ')
            ? authorization.slice('Bearer '.length).trim()
            : '';

          if (!accessToken) {
            try {
              const sessionResult = await supabase?.auth.getSession();
              accessToken = sessionResult?.data.session?.access_token || '';
            } catch {
              accessToken = '';
            }
          }

          if (accessToken) {
            const proxyUrl = `${window.location.origin}/api/profiles/${encodeURIComponent(match[1])}/presence`;
            return fetch(proxyUrl, {
              method: 'PATCH',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
              },
              credentials: 'omit',
              body: JSON.stringify({ presence })
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('Supabase transport fallback:', error);
  }

  return fetch(input, init);
};

supabase = isSupabaseConfigured
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

export { supabase };

if (typeof window !== 'undefined') {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const request = input instanceof Request ? input : null;
      const requestUrl = typeof input === 'string' ? input : request?.url || String(input);
      const parsed = new URL(requestUrl, window.location.origin);
      const isStatusProxyRequest = parsed.pathname.startsWith('/api/profiles/') && parsed.pathname.endsWith('/status');
      if (isStatusProxyRequest) {
        const headers = new Headers(init?.headers || request?.headers || undefined);
        const authorization = headers.get('authorization') || '';
        const accessToken = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
        headers.delete('authorization');
        headers.delete('cookie');
        let body: Record<string, unknown> = {};
        try {
          if (typeof init?.body === 'string') body = JSON.parse(init.body) || {};
          else if (request) body = JSON.parse(await request.clone().text()) || {};
        } catch {
          body = {};
        }
        if (accessToken) body.access_token = accessToken;
        return nativeFetch(input, {
          ...init,
          credentials: 'omit',
          headers,
          body: JSON.stringify(body)
        });
      }
    } catch (error) {
      console.warn('Inkorium status transport fallback:', error);
    }
    return nativeFetch(input, init);
  };
}
