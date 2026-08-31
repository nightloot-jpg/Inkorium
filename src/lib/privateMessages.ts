import { supabase } from './supabase';

const SUPABASE_URL = 'https://zllwzmfsfzfedorljgtg.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/private-messages`;

type Message = Record<string, unknown>;

async function accessToken(): Promise<string> {
  const session = await supabase?.auth.getSession();
  return session?.data.session?.access_token || '';
}

async function request(path = '', init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${FUNCTION_URL}${path}`, {
    ...init,
    headers,
    credentials: 'omit',
  });
}

export async function listPrivateMessages(): Promise<Message[]> {
  const params = new URLSearchParams({
    select: 'id,sender_id,recipient_id,subject,body,is_read,created_at',
    order: 'created_at.desc',
  });
  const response = await request(`?${params.toString()}`);
  if (!response.ok) throw new Error(`private-messages GET ${response.status}`);
  return response.json();
}

export async function markPrivateMessageRead(id: string, recipientId: string): Promise<void> {
  const params = new URLSearchParams({ id: `eq.${id}`, recipient_id: `eq.${recipientId}` });
  const response = await request(`?${params.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ is_read: true }),
  });
  if (!response.ok) throw new Error(`private-messages PATCH ${response.status}`);
}

export async function sendPrivateMessage(input: {
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
}): Promise<Message | null> {
  const params = new URLSearchParams({ select: 'id,sender_id,recipient_id,subject,body,is_read,created_at' });
  const response = await request(`?${params.toString()}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`private-messages POST ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? (data[0] || null) : data;
}

export async function deletePrivateMessage(id: string): Promise<void> {
  const params = new URLSearchParams({ id: `eq.${id}` });
  const response = await request(`?${params.toString()}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  if (!response.ok) throw new Error(`private-messages DELETE ${response.status}`);
}
