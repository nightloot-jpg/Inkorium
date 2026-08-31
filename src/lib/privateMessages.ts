import { supabase } from './supabase';

const SUPABASE_URL = 'https://zllwzmfsfzfedorljgtg.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/private-messages`;

type Message = Record<string, unknown>;

async function accessToken(): Promise<string> {
  const session = await supabase?.auth.getSession();
  return session?.data.session?.access_token || '';
}

export async function privateMessagesFetch(
  path = '',
  init: RequestInit = {},
): Promise<Response> {
  const token = await accessToken();
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${FUNCTION_URL}${path}`, {
    ...init,
    headers,
    credentials: 'omit',
  });
}

export async function listPrivateMessages(query = ''): Promise<Message[]> {
  const response = await privateMessagesFetch(query ? `?${query}` : '');
  if (!response.ok) throw new Error(`private-messages GET ${response.status}`);
  return response.json();
}
