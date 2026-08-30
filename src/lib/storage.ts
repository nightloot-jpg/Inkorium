import { supabase } from './supabase';

export type StorageFolder = 'photos' | 'covers' | 'avatars' | 'post-media' | 'videos' | 'music' | 'chat';

type Ticket = { key: string; uploadUrl: string; url?: string | null; expiresIn?: number };

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  let session = data.session;
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    session = refreshed.data.session;
  }
  if (!session?.access_token) throw new Error('Tu sesión de Inkorium ha caducado. Vuelve a iniciar sesión.');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function invoke(body: Record<string, unknown>) {
  const result = await supabase.functions.invoke('media-storage', { body, headers: await authHeaders() });
  if (result.error) throw result.error;
  return result.data as Record<string, any>;
}

export async function createStorageUploadTicket(input: { folder: StorageFolder; file: File; channelId?: string }) {
  const data = await invoke({
    action: 'upload',
    folder: input.folder,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    ...(input.channelId ? { channelId: input.channelId } : {}),
  });
  if (!data.uploadUrl || !data.key) throw new Error(data.error || 'No se pudo preparar la subida.');
  return data as Ticket;
}

export async function uploadFileDirectToStorage(input: { folder: StorageFolder; file: File }) {
  const form = new FormData();
  form.append('action', 'upload-direct');
  form.append('folder', input.folder);
  form.append('file', input.file, input.file.name);
  const result = await supabase.functions.invoke('media-storage', { body: form, headers: await authHeaders() });
  if (result.error) throw result.error;
  const data = result.data as Record<string, any>;
  if (!data.url || !data.key) throw new Error(data.error || 'No se pudo subir el archivo.');
  return data as Ticket;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: Blob, contentType: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(uploadUrl, { method: 'PUT', mode: 'cors', headers: { 'Content-Type': contentType }, body: file, signal: controller.signal });
    if (!response.ok) throw new Error((await response.text().catch(() => '')) || `La subida fue rechazada (${response.status}).`);
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function deleteStorageObject(key: string) {
  const data = await invoke({ action: 'delete', key });
  if (data.error) throw new Error(data.error);
}

export async function getStorageSignedUrl(key: string) {
  const data = await invoke({ action: 'get', key });
  if (!data.url) throw new Error(data.error || 'No se pudo obtener la URL del archivo.');
  return String(data.url);
}
