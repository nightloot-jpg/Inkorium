import { supabase } from './supabase';

export type YoutubeEndpoint = 'search' | 'videos' | 'playlistItems';

export type YoutubeResponse = {
  items?: any[];
  nextPageToken?: string;
  error?: { message?: string };
};

export async function youtubeRequest(
  endpoint: YoutubeEndpoint,
  params: Record<string, string | number | undefined>,
): Promise<YoutubeResponse> {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

  const { data, error } = await supabase.functions.invoke('youtube-search', {
    body: { endpoint, params: cleanParams },
  });

  if (error) {
    const status = (error as any)?.context?.status;
    throw new Error(status ? `YouTube proxy (${status}): ${error.message}` : (error.message || 'No se pudo consultar YouTube.'));
  }

  const response = (data || {}) as YoutubeResponse;
  if (response.error?.message) throw new Error(response.error.message);
  return response;
}
