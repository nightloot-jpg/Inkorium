import { supabase } from '../lib/supabase';

/**
 * Legacy compatibility adapter for old components that still construct
 * googleapis.com YouTube URLs. New code must use src/lib/youtube.ts directly.
 *
 * This adapter intentionally does not install itself at module load time.
 * Call installLegacyYoutubeFetchCompatibility() only from a legacy surface
 * that still needs it, then call the returned cleanup function when that
 * surface is unmounted.
 */

const YOUTUBE_HOST = 'www.googleapis.com';
const YOUTUBE_PREFIX = '/youtube/v3/';
const ENDPOINTS = new Set(['search', 'videos', 'playlistItems']);

type LegacyRequest = { endpoint: string; params: Record<string, string> };

function parseYoutubeRequest(input: RequestInfo | URL): LegacyRequest | null {
  const raw = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  try {
    const url = new URL(raw, window.location.origin);
    if (url.hostname !== YOUTUBE_HOST || !url.pathname.startsWith(YOUTUBE_PREFIX)) return null;

    const endpoint = url.pathname.slice(YOUTUBE_PREFIX.length).split('/')[0];
    if (!ENDPOINTS.has(endpoint)) return null;

    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== 'key') params[key] = value;
    });
    return { endpoint, params };
  } catch {
    return null;
  }
}

async function invokeYoutube(request: LegacyRequest): Promise<Response> {
  try {
    const { data, error } = await supabase.functions.invoke('youtube-search', {
      body: request,
    });

    if (error) {
      const status = (error as any)?.context?.status || 502;
      return new Response(JSON.stringify({ error: error.message || 'No se pudo consultar YouTube.' }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data ?? { items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[YouTubeLegacyProxy] Error invoking youtube-search:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'No se pudo consultar YouTube.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export function installLegacyYoutubeFetchCompatibility(): () => void {
  const nativeFetch = window.fetch.bind(window);
  const previousFetch = window.fetch;

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = parseYoutubeRequest(input);
    if (!request) return nativeFetch(input, init);
    return invokeYoutube(request);
  }) as typeof window.fetch;

  return () => {
    if (window.fetch !== previousFetch) window.fetch = previousFetch;
  };
}
