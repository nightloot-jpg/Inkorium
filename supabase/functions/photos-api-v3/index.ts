const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zllwzmfsfzfedorljgtg.supabase.co';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function getBearer(req: Request): string {
  return (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
}

async function supabaseRequest(path: string, init: RequestInit = {}, token?: string, admin = false) {
  const key = admin && SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  const headers = new Headers(init.headers || {});
  if (key) headers.set('apikey', key);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else if (key) headers.set('Authorization', `Bearer ${key}`);
  headers.set('Accept', 'application/json');
  return fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const token = getBearer(req);
    if (!token) return json({ error: 'AUTH_REQUIRED' }, 401);
    if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'SUPABASE_KEYS_NOT_CONFIGURED' }, 500);

    const authResponse = await supabaseRequest('/auth/v1/user', { method: 'GET' }, token);
    const authText = await authResponse.text();
    if (!authResponse.ok) return json({ error: 'AUTH_INVALID', upstream_status: authResponse.status }, 401);
    let user: any;
    try { user = JSON.parse(authText); } catch { return json({ error: 'AUTH_INVALID' }, 401); }
    const userId = String(user?.id || '').trim();
    if (!userId) return json({ error: 'AUTH_INVALID' }, 401);

    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || 'list').toLowerCase();

    if (action === 'list') {
      const response = await supabaseRequest('/rest/v1/photos?select=id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at&order=created_at.desc', { method: 'GET' }, token);
      const body = await response.text();
      if (!response.ok) return json({ error: 'PHOTO_LIST_FAILED', upstream_status: response.status, upstream: body.slice(0, 1000) }, response.status >= 500 ? 502 : response.status);
      let data: unknown = [];
      try { data = JSON.parse(body); } catch { return json({ error: 'PHOTO_LIST_INVALID_RESPONSE' }, 502); }
      return json(Array.isArray(data) ? data : []);
    }

    if (action === 'create') {
      const albumId = payload?.album_id ? String(payload.album_id).trim() : null;
      const url = String(payload?.url || '').trim();
      const caption = payload?.caption == null ? null : String(payload.caption).slice(0, 500);
      const visibility = ['public', 'friends', 'private'].includes(String(payload?.visibility)) ? String(payload.visibility) : 'public';
      if (!url) return json({ error: 'INVALID_PHOTO_URL' }, 400);

      if (albumId) {
        const albumResponse = await supabaseRequest(`/rest/v1/albums?id=eq.${encodeURIComponent(albumId)}&select=id,user_id`, { method: 'GET' }, token);
        const albumBody = await albumResponse.text();
        if (!albumResponse.ok) return json({ error: 'ALBUM_LOOKUP_FAILED', upstream_status: albumResponse.status }, 502);
        let albums: any[] = [];
        try { albums = JSON.parse(albumBody); } catch {}
        if (!albums[0] || String(albums[0].user_id) !== userId) return json({ error: 'INVALID_ALBUM' }, 403);
      }

      const insertResponse = await supabaseRequest('/rest/v1/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ user_id: userId, album_id: albumId, storage_path: url, url, caption, visibility }),
      }, token);
      const insertBody = await insertResponse.text();
      if (!insertResponse.ok) return json({ error: 'PHOTO_INSERT_FAILED', upstream_status: insertResponse.status, upstream: insertBody.slice(0, 1000) }, insertResponse.status >= 500 ? 502 : insertResponse.status);
      let data: unknown;
      try { data = JSON.parse(insertBody); } catch { return json({ error: 'PHOTO_INSERT_INVALID_RESPONSE' }, 502); }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return json({ error: 'PHOTO_INSERT_EMPTY_RESPONSE' }, 502);
      return json(row, 201);
    }

    return json({ error: 'INVALID_ACTION' }, 400);
  } catch (error) {
    console.error('photos-api-v3 failed:', error);
    return json({ error: 'PHOTOS_API_V3_FAILED', message: error instanceof Error ? error.message : String(error) }, 500);
  }
});