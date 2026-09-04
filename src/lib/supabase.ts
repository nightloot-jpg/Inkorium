import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zllwzmfsfzfedorljgtg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_npJmIHQP_g2ApAu-7fqQAQ_d2p';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL).trim();
const supabaseKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project'));

let supabase: ReturnType<typeof createClient> | null = null;

async function getSessionToken(): Promise<string> {
  try {
    const { data, error } = await supabase?.auth.getSession() ?? { data: { session: null }, error: null };
    if (error) return '';
    return data.session?.access_token || '';
  } catch {
    return '';
  }
}

const profileAwareFetch: typeof fetch = async (input, init) => {
  const request = input instanceof Request ? input : null;
  const requestUrl = typeof input === 'string' ? input : request?.url || String(input);
  const requestMethod = String(init?.method || request?.method || 'GET').toUpperCase();

  try {
    const parsed = new URL(requestUrl);
    const isProfilesRequest = parsed.origin === supabaseUrl && parsed.pathname.replace(/\/+$/, '') === '/rest/v1/profiles';
    const isPrivateMessagesRequest = parsed.origin === supabaseUrl && parsed.pathname.replace(/\/+$/, '') === '/rest/v1/private_messages';
    const isPostsRequest = parsed.origin === supabaseUrl && parsed.pathname.replace(/\/+$/, '') === '/rest/v1/posts';
    const isPhotosRequest = parsed.origin === supabaseUrl && parsed.pathname.replace(/\/+$/, '') === '/rest/v1/photos';

    if (isProfilesRequest && typeof window !== 'undefined') {
      const headers = new Headers(init?.headers || request?.headers || undefined);
      if (requestMethod === 'GET') {
        return fetch(`${window.location.origin}/api/profiles${parsed.search}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          cache: 'no-store'
        });
      }
      if (requestMethod === 'PATCH') {
        const queryId = parsed.searchParams.get('id') || '';
        const match = queryId.match(/^eq\.(.+)$/);
        let rawBody = '';
        try { if (typeof init?.body === 'string') rawBody = init.body; else if (request) rawBody = await request.clone().text(); } catch { rawBody = ''; }
        let body: Record<string, unknown> = {};
        try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }
        const presence = typeof body.presence === 'string' ? body.presence.trim().toLowerCase() : '';
        const accessToken = headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || await getSessionToken();
        if (match && presence && ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presence) && accessToken) {
          return fetch(`${window.location.origin}/api/profiles/${encodeURIComponent(match[1])}/presence`, {
            method: 'PATCH',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            credentials: 'omit',
            body: JSON.stringify({ presence })
          });
        }
      }
    }

    if (isPostsRequest && typeof window !== 'undefined' && requestMethod === 'GET') {
      return fetch(`${window.location.origin}/api/posts${parsed.search}`, {
        method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store'
      });
    }

    if (isPhotosRequest && typeof window !== 'undefined' && requestMethod === 'GET') {
      return fetch(`${window.location.origin}/api/photos${parsed.search}`, {
        method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store'
      });
    }

    if (isPrivateMessagesRequest && typeof window !== 'undefined') {
      const headers = new Headers(init?.headers || request?.headers || undefined);
      const accessToken = headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || await getSessionToken();
      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'AUTH_REQUIRED' }), { status: 401, headers: { 'content-type': 'application/json' } });
      }

      let rawBody = '';
      try { if (typeof init?.body === 'string') rawBody = init.body; else if (request && request.body) rawBody = await request.clone().text(); } catch { rawBody = ''; }
      let body: Record<string, unknown> = {};
      try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }

      const proxyOptions: RequestInit = {
        method: requestMethod,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'omit'
      };
      if (requestMethod === 'GET') {
        return fetch(`${window.location.origin}/api/private-messages${parsed.search}`, proxyOptions);
      }
      if (['POST', 'PATCH', 'DELETE'].includes(requestMethod)) {
        proxyOptions.body = JSON.stringify(body);
        return fetch(`${window.location.origin}/api/private-messages${parsed.search}`, proxyOptions);
      }
    }
  } catch (error) {
    console.warn('Supabase transport fallback:', error);
  }

  return fetch(input, init);
};

supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { fetch: profileAwareFetch }
}) : null;

export { supabase };
