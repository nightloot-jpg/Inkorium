import { supabase } from './supabase';

type StorageUploadTicket = {
  key: string;
  uploadUrl: string;
  url?: string | null;
  expiresIn?: number;
};

type DirectStorageUpload = {
  key: string;
  url?: string | null;
  expiresIn?: number;
};

export type StorageFolder = 'photos' | 'covers' | 'avatars' | 'post-media' | 'videos' | 'music' | 'chat';

async function getAuthHeaders() {
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

async function invokeStorage(body: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const result = await supabase.functions.invoke('media-storage', { body, headers });
  if (result.error) {
    const fallback = result.error instanceof Error ? result.error.message : 'No se pudo preparar el almacenamiento de media.';
    const context = (result.error as { context?: Response } | null)?.context;
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json() as { error?: string; message?: string };
        if (payload.error || payload.message) throw new Error(payload.error || payload.message);
      } catch {
        // Keep the SDK error when the response is not JSON.
      }
    }
    throw new Error(fallback);
  }
  return result.data;
}

async function invokeStorageFormData(formData: FormData) {
  const headers = await getAuthHeaders();
  const result = await supabase.functions.invoke('media-storage', { body: formData, headers });
  if (result.error) {
    const fallback = result.error instanceof Error ? result.error.message : 'No se pudo subir el archivo al almacenamiento de media.';
    const context = (result.error as { context?: Response } | null)?.context;
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json() as { error?: string; message?: string };
        if (payload.error || payload.message) throw new Error(payload.error || payload.message);
      } catch {
        // Keep the SDK error when the response is not JSON.
      }
    }
    throw new Error(fallback);
  }
  return result.data;
}

export async function createStorageUploadTicket(input: {
  folder: StorageFolder;
  file: File;
  channelId?: string;
}) {
  const data = await invokeStorage({
    action: 'upload',
    folder: input.folder,
    fileName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    ...(input.channelId ? { channelId: input.channelId } : {}),
  });

  if (!data?.uploadUrl || !data?.key) {
    throw new Error(data?.error || 'El almacenamiento de media no devolvió una URL de subida válida.');
  }

  return data as StorageUploadTicket;
}

export async function uploadFileDirectToStorage(input: {
  folder: StorageFolder;
  file: File;
}) {
  const formData = new FormData();
  formData.append('action', 'upload-direct');
  formData.append('folder', input.folder);
  formData.append('file', input.file, input.file.name);

  const data = await invokeStorageFormData(formData);
  if (!data?.url || !data?.key) {
    throw new Error(data?.error || 'El almacenamiento de media no devolvió una URL válida.');
  }

  return data as DirectStorageUpload;
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
      throw new Error(detail || `El almacenamiento de media rechazó la subida (${response.status}).`);
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('La subida de media tardó demasiado. Comprueba la conexión y vuelve a intentarlo.');
    }
    if (error instanceof TypeError && /fetch/i.test(error.message || '')) {
      throw new Error('El navegador no puede conectar con el almacenamiento de media. Comprueba la política CORS del bucket.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function deleteStorageObject(key: string) {
  const data = await invokeStorage({ action: 'delete', key });
  if (data?.error) throw new Error(data.error);
}

export async function getStorageSignedUrl(key: string) {
  const data = await invokeStorage({ action: 'get', key });
  if (!data?.url) throw new Error(data?.error || 'El almacenamiento de media no devolvió una URL válida.');
  return data.url as string;
}
