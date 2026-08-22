import { supabase } from '../lib/supabase';

const nativeFetch = window.fetch.bind(window);

function youtubeRequest(input: RequestInfo | URL) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  try {
    const original = new URL(url, window.location.origin);
    if (original.hostname !== 'www.googleapis.com') return null;

    const prefix = '/youtube/v3/';
    if (!original.pathname.startsWith(prefix)) return null;

    const endpoint = original.pathname.slice(prefix.length).split('/')[0];
    if (!['search', 'videos', 'playlistItems'].includes(endpoint)) return null;

    const params: Record<string, string> = {};
    original.searchParams.forEach((value, key) => {
      if (key !== 'key') params[key] = value;
    });

    return { endpoint, params };
  } catch {
    return null;
  }
}

window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = youtubeRequest(input);
  if (!request) return nativeFetch(input, init);

  try {
    const { data, error } = await supabase.functions.invoke('youtube-search', {
      body: request,
    });

    if (error) {
      const status = (error as any)?.context?.status || 502;
      return new Response(
        JSON.stringify({ error: error.message || 'No se pudo consultar YouTube.' }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify(data ?? { items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[YouTubeProxy] Error invoking youtube-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'No se pudo consultar YouTube.' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}) as typeof window.fetch;
