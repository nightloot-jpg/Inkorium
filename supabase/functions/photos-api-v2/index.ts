import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ error: 'AUTH_REQUIRED' }, 401);

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData?.user) return json({ error: 'AUTH_REQUIRED' }, 401);

    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || 'list').toLowerCase();

    if (action === 'list') {
      const { data, error } = await client
        .from('photos')
        .select('id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at')
        .order('created_at', { ascending: false });

      if (error) return json({ error: 'PHOTO_LIST_FAILED', message: error.message }, 500);
      return json(Array.isArray(data) ? data : []);
    }

    if (action === 'create') {
      const albumId = payload?.album_id ? String(payload.album_id) : null;
      const url = String(payload?.url || '').trim();
      const caption = payload?.caption == null ? null : String(payload.caption).slice(0, 500);
      const visibility = ['public', 'friends', 'private'].includes(String(payload?.visibility))
        ? String(payload.visibility)
        : 'public';

      if (!url) return json({ error: 'INVALID_PHOTO_URL' }, 400);

      if (albumId) {
        const { data: album, error: albumError } = await client
          .from('albums')
          .select('id,user_id')
          .eq('id', albumId)
          .maybeSingle();
        if (albumError) return json({ error: 'ALBUM_LOOKUP_FAILED', message: albumError.message }, 500);
        if (!album || String(album.user_id) !== authData.user.id) return json({ error: 'INVALID_ALBUM' }, 403);
      }

      const { data, error } = await client
        .from('photos')
        .insert({
          user_id: authData.user.id,
          album_id: albumId,
          storage_path: url,
          url,
          caption,
          visibility,
          updated_at: new Date().toISOString(),
        })
        .select('id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at')
        .single();

      if (error) return json({ error: 'PHOTO_INSERT_FAILED', message: error.message }, 500);
      return json(data, 201);
    }

    return json({ error: 'INVALID_ACTION' }, 400);
  } catch (error) {
    console.error('photos-api-v2 failed:', error);
    return json({ error: 'PHOTOS_API_FAILED', message: error instanceof Error ? error.message : String(error) }, 500);
  }
});
