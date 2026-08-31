import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'AUTH_REQUIRED' }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    const user = authData.user;
    if (authError || !user) return json({ error: 'AUTH_REQUIRED' }, 401);
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const payload = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = String(payload?.action || 'list').toLowerCase();
    if (req.method === 'POST' && action === 'create') {
      const albumId = payload?.album_id ? String(payload.album_id) : null;
      const url = String(payload?.url || '').trim();
      const caption = payload?.caption == null ? null : String(payload.caption).slice(0, 500);
      const visibility = ['public', 'friends', 'private'].includes(String(payload?.visibility)) ? String(payload.visibility) : 'public';
      if (!url) return json({ error: 'INVALID_PHOTO_URL' }, 400);
      if (albumId) {
        const { data: album, error: albumError } = await adminClient.from('albums').select('id,user_id').eq('id', albumId).maybeSingle();
        if (albumError) return json({ error: 'ALBUM_LOOKUP_FAILED', message: albumError.message }, 500);
        if (!album || String(album.user_id) !== user.id) return json({ error: 'INVALID_ALBUM' }, 403);
      }
      const { data, error } = await adminClient.from('photos').insert({ user_id: user.id, album_id: albumId, storage_path: url, url, caption, visibility, updated_at: new Date().toISOString() }).select('id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at').single();
      if (error) return json({ error: 'PHOTO_INSERT_FAILED', message: error.message }, 500);
      return json(data, 201);
    }
    const { data, error } = await userClient.from('photos').select('id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at').order('created_at', { ascending: false });
    if (error) return json({ error: 'PHOTO_LIST_FAILED', message: error.message }, 500);
    return json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('photos-api failed:', error);
    return json({ error: 'PHOTOS_API_FAILED', message: error instanceof Error ? error.message : String(error) }, 500);
  }
});
