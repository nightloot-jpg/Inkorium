/**
 * Storage client for Hetzner Object Storage (S3-compatible).
 * All persistent media uploads go through the same-origin /api/upload endpoint.
 * Supabase Storage is intentionally not used as a browser-side fallback.
 */

export const STORAGE_PUBLIC_URL = import.meta.env.VITE_STORAGE_PUBLIC_URL || '';
export const STORAGE_BUCKET_NAME = import.meta.env.VITE_STORAGE_BUCKET_NAME || 'inkorium-media';

export async function uploadMediaFile(
  fileOrDataUrl: File | Blob | string,
  folder: 'avatars' | 'photos' | 'wall' = 'photos'
): Promise<string> {
  let blob: Blob;
  let originalName = `upload-${Date.now()}.jpg`;

  if (typeof fileOrDataUrl === 'string') {
    if (/^https?:\/\//i.test(fileOrDataUrl)) return fileOrDataUrl;

    const [header, data] = fileOrDataUrl.split(',', 2);
    if (!data) throw new Error('La imagen no tiene un formato de datos válido.');
    const mime = header.match(/^data:([^;]+);base64$/i)?.[1] || 'image/jpeg';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    blob = new Blob([bytes], { type: mime });
    originalName = `image-${Date.now()}.${mime.split('/')[1] || 'jpg'}`;
  } else if (fileOrDataUrl instanceof File) {
    blob = fileOrDataUrl;
    originalName = fileOrDataUrl.name || originalName;
  } else {
    blob = fileOrDataUrl;
  }

  const formData = new FormData();
  formData.append('file', blob, originalName);
  formData.append('folder', folder);

  let response: Response;
  try {
    response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
  } catch (error: any) {
    throw new Error(error?.message || 'No se pudo conectar con el servidor de almacenamiento.');
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message = typeof body === 'object'
      ? body?.message || body?.error
      : body;
    throw new Error(message || `Error de subida (${response.status}).`);
  }

  if (!body?.url || typeof body.url !== 'string') {
    throw new Error('El servidor de almacenamiento no devolvió una URL válida.');
  }

  return body.url;
}
