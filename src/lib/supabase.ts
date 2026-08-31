import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zllwzmfsfzfedorljgtg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_npJmIHQP_g2ApAu-7fqQAQ_d2p';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL).trim();
const supabaseKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project'));

let supabase: ReturnType<typeof createClient> | null = null;

const profileAwareFetch: typeof fetch = async (input, init) => {
  const request = input instanceof Request ? input : null;
  const requestUrl = typeof input === 'string' ? input : request?.url || String(input);
  const requestMethod = String(init?.method || request?.method || 'GET').toUpperCase();

  try {
    const parsed = new URL(requestUrl);
    const isProfilesRequest = parsed.origin === supabaseUrl && parsed.pathname.replace(/\/+$/, '') === '/rest/v1/profiles';
    const isPrivateMessagesRequest = parsed.origin === supabaseUrl && parsed.pathname.replace(/\/+$/, '') === '/rest/v1/private_messages';

    if (isProfilesRequest && typeof window !== 'undefined') {
      if (requestMethod === 'GET') {
        return fetch(`${window.location.origin}/api/profiles${parsed.search}`, {
          method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store'
        });
      }
      if (requestMethod === 'PATCH') {
        const headers = new Headers(init?.headers || request?.headers || undefined);
        const queryId = parsed.searchParams.get('id') || '';
        const match = queryId.match(/^eq\.(.+)$/);
        let rawBody = '';
        try { if (typeof init?.body === 'string') rawBody = init.body; else if (request) rawBody = await request.clone().text(); } catch { rawBody = ''; }
        let body: Record<string, unknown> = {};
        try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }
        const presence = typeof body.presence === 'string' ? body.presence.trim().toLowerCase() : '';
        const authorization = headers.get('authorization') || '';
        let accessToken = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
        if (!accessToken) { try { accessToken = (await supabase?.auth.getSession())?.data.session?.access_token || ''; } catch { accessToken = ''; } }
        if (match && presence && ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presence) && accessToken) {
          return fetch(`${window.location.origin}/api/profiles/${encodeURIComponent(match[1])}/presence`, {
            method: 'PATCH', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, credentials: 'omit',
            body: JSON.stringify({ presence, access_token: accessToken })
          });
        }
      }
    }

    if (isPrivateMessagesRequest && typeof window !== 'undefined') {
      const headers = new Headers(init?.headers || request?.headers || undefined);
      const authorization = headers.get('authorization') || '';
      let accessToken = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
      if (!accessToken) { try { accessToken = (await supabase?.auth.getSession())?.data.session?.access_token || ''; } catch { accessToken = ''; } }

      let rawBody = '';
      try { if (typeof init?.body === 'string') rawBody = init.body; else if (request && request.body) rawBody = await request.clone().text(); } catch { rawBody = ''; }
      let body: Record<string, unknown> = {};
      try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }
      body.access_token = accessToken;

      if (requestMethod === 'GET') {
        return fetch(`${window.location.origin}/api/private-messages`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          credentials: 'omit',
          body: JSON.stringify({ action: 'list', access_token: accessToken }),
        });
      }

      const proxyOptions: RequestInit = {
        method: requestMethod,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'omit',
      };
      if (['POST', 'PATCH', 'DELETE'].includes(requestMethod)) proxyOptions.body = JSON.stringify(body);
      return fetch(`${window.location.origin}/api/private-messages${parsed.search}`, proxyOptions);
    }
  } catch (error) { console.warn('Supabase transport fallback:', error); }
  return fetch(input, init);
};

supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { fetch: profileAwareFetch }
}) : null;

export { supabase };
