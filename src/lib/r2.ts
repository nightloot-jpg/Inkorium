import { supabase } from './supabase';
import { readR2FunctionError } from './r2-upload-error';

type R2UploadTicket = {
  key: string;
  uploadUrl: string;
  url?: string | null;
  expiresIn?: number;
};

export type R2Folder = 'photos' | 'covers' | 'avatars' | 'post-media' | 'videos' | 'music' | 'chat';

export async function createR2UploadTicket(input: {
  functionName?: string;
  folder: R2Folder;
  file: File;
}) {
  const functionName = input.functionName ?? 'r2-media';
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      action: 'upload',
      folder: input.folder,
      fileName: input.file.name,
      contentType: input.file.type || 'application/octet-stream',
      size: input.file.size,
    },
  });

  if (error) throw new Error(await readR2FunctionError(error));
  if (!data?.uploadUrl || !data?.key) throw new Error(data?.error || 'Cloudflare R2 no devolvió una URL de subida válida.');

  return data as R2UploadTicket;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: Blob, contentType: string) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Cloudflare R2 rechazó la subida (${response.status}).`);
  }
}

export async function deleteR2Object(key: string, functionName = 'r2-media') {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { action: 'delete', key },
  });
  if (error) throw new Error(await readR2FunctionError(error));
  if (data?.error) throw new Error(data.error);
}

export async function getR2SignedUrl(key: string, functionName = 'r2-media') {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { action: 'get', key },
  });
  if (error) throw new Error(await readR2FunctionError(error));
  if (!data?.url) throw new Error(data?.error || 'R2 no devolvió una URL válida.');
  return data.url as string;
}
