import { supabase } from './supabase';
import { readR2FunctionError } from './r2-upload-error';

type R2UploadTicket = {
  key: string;
  uploadUrl: string;
  url?: string | null;
  expiresIn?: number;
};

export type R2Folder = 'photos' | 'covers' | 'avatars' | 'post-media' | 'videos' | 'music' | 'chat';

async function getR2AuthHeaders() {
  const current = await supabase.auth.getSession();
  let session = current.data.session;

  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    session = refreshed.data.session;
  }

  if (!session?.access_token) {
    throw new Error('Tu sesión de Inkorium ha caducado. Vuelve a iniciar sesión y prueba de nuevo.');
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

async function invokeR2(functionName: string, body: Record<string, unknown>) {
  const headers = await getR2AuthHeaders();
  const result = await supabase.functions.invoke(functionName, { body, headers });
  if (result.error) throw new Error(await readR2FunctionError(result.error));
  return result.data;
}

export async function createR2UploadTicket(input: {
  functionName?: string;
  folder: R2Folder;
  file: File;
}) {
  const functionName = input.functionName ?? 'r2-media';
  const data = await invokeR2(functionName, {
    action: 'upload',
    folder: input.folder,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
    size: input.file.size,
  });

  if (!data?.uploadUrl || !data?.key) {
    throw new Error(data?.error || 'Cloudflare R2 no devolvió una URL de subida válida.');
  }

  return data as R2UploadTicket;
}

export async function uploadToPresignedUrl(uploadUrl: string, file: Blob, contentType: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      mode: 'cors',
      headers: { 'Content-Type': contentType },
      body: file,
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Cloudflare R2 rechazó la subida (${response.status}).`);
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('La subida a Cloudflare R2 tardó demasiado. Comprueba la conexión y vuelve a intentarlo.');
    }
    if (error instanceof TypeError && /fetch/i.test(error.message || '')) {
      throw new Error('El navegador no puede conectar con Cloudflare R2. Comprueba la política CORS del bucket.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function deleteR2Object(key: string, functionName = 'r2-media') {
  const data = await invokeR2(functionName, { action: 'delete', key });
  if (data?.error) throw new Error(data.error);
}

export async function getR2SignedUrl(key: string, functionName = 'r2-media') {
  const data = await invokeR2(functionName, { action: 'get', key });
  if (!data?.url) throw new Error(data?.error || 'R2 no devolvió una URL válida.');
  return data.url as string;
}
