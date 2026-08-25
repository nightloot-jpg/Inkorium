import { supabase } from '../../../lib/supabase';
import type { Signature } from '../types/profile.types';

export async function getProfileSignatures(profileId: string): Promise<Signature[]> {
  const { data, error } = await supabase
    .from('profile_signatures')
    .select('id, content, created_at, author_id')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;

  const rows = (data || []) as Signature[];
  const authorIds = Array.from(new Set(rows.map(row => row.author_id).filter(Boolean)));
  if (!authorIds.length) return rows;

  const { data: authors, error: authorsError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', authorIds);

  if (authorsError) throw authorsError;

  const authorMap = new Map((authors || []).map(author => [author.id, {
    username: author.username,
    full_name: author.full_name,
    avatar_url: author.avatar_url,
  }]));

  return rows.map(row => ({ ...row, author: authorMap.get(row.author_id) || null }));
}

export async function createProfileSignature(profileId: string, authorId: string, content: string): Promise<Signature> {
  const { data, error } = await supabase
    .from('profile_signatures')
    .insert({ profile_id: profileId, author_id: authorId, content })
    .select('id, content, created_at, author_id')
    .single();

  if (error) throw error;
  return data as Signature;
}
