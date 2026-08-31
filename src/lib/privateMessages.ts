import { supabase } from './supabase';

type Message = Record<string, unknown>;

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

export async function listPrivateMessages(): Promise<Message[]> {
  const { data, error } = await client()
    .from('private_messages')
    .select('id,sender_id,recipient_id,subject,body,is_read,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Message[];
}

export async function markPrivateMessageRead(id: string, recipientId: string): Promise<void> {
  const { error } = await client()
    .from('private_messages')
    .update({ is_read: true } as never)
    .eq('id', id)
    .eq('recipient_id', recipientId);

  if (error) throw error;
}

export async function sendPrivateMessage(input: {
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
}): Promise<Message | null> {
  const { data, error } = await client()
    .from('private_messages')
    .insert(input as never)
    .select('id,sender_id,recipient_id,subject,body,is_read,created_at')
    .maybeSingle();

  if (error) throw error;
  return data as Message | null;
}

export async function deletePrivateMessage(id: string): Promise<void> {
  const { error } = await client()
    .from('private_messages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
