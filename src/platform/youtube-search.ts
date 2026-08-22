import { supabase } from '../lib/supabase';

type YouTubeRequest = {
  endpoint: 'search' | 'videos' | 'playlistItems';
  params: Record<string, string>;
};

export async function youtubeSearch<T = any>(request: YouTubeRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke('youtube-search', {
    body: request,
  });

  if (error) {
    const status = (error as any)?.context?.status;
    const message = error.message || 'No se pudo consultar YouTube.';
    const details = status ? ` (${status})` : '';
    throw new Error(`${message}${details}`);
  }

  if (!data) {
    throw new Error('YouTube no devolvió resultados.');
  }

  return data as T;
}

export function buildYouTubeSearchRequest(query: string, maxResults = 15): YouTubeRequest {
  return {
    endpoint: 'search',
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(Math.min(Math.max(maxResults, 1), 25)),
    },
  };
}
