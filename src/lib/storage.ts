/**
 * Storage client for Hetzner Object Storage (S3-compatible), Supabase Storage and Cloudflare R2.
 */
import { supabase, isSupabaseConfigured } from './supabase';

export const STORAGE_PUBLIC_URL = import.meta.env.VITE_STORAGE_PUBLIC_URL || '';
export const STORAGE_BUCKET_NAME = import.meta.env.VITE_STORAGE_BUCKET_NAME || 'inkorium-media';

/**
 * Converts a data URL to a Blob
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads a media file to Hetzner Object Storage (via /api/upload)
 * with automatic fallback to Supabase Storage or base64 DataURL.
 */
export async function uploadMediaFile(
  fileOrDataUrl: File | Blob | string, 
  folder: 'avatars' | 'photos' | 'wall' = 'photos'
): Promise<string> {
  let blob: Blob;
  let fileExt = 'jpg';
  let originalName = `upload-${Date.now()}.jpg`;

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
      return fileOrDataUrl;
    }
    blob = dataURLtoBlob(fileOrDataUrl);
    fileExt = blob.type.split('/')[1] || 'jpg';
    originalName = `image-${Date.now()}.${fileExt}`;
  } else if (fileOrDataUrl instanceof File) {
    blob = fileOrDataUrl;
    fileExt = fileOrDataUrl.name.split('.').pop() || 'jpg';
    originalName = fileOrDataUrl.name;
  } else {
    blob = fileOrDataUrl;
    fileExt = blob.type.split('/')[1] || 'jpg';
    originalName = `blob-${Date.now()}.${fileExt}`;
  }

  // 1. PRIMARY: Try Hetzner Object Storage server endpoint (/api/upload)
  try {
    const formData = new FormData();
    formData.append('file', blob, originalName);
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.url) {
        console.log('✅ Archivo subido con éxito al bucket de Hetzner Object Storage:', data.url);
        return data.url;
      }
    } else {
      const errorJson = await response.json().catch(() => ({}));
      console.warn('Hetzner S3 upload endpoint info:', errorJson.message || response.statusText);
    }
  } catch (apiErr) {
    console.warn('No se pudo conectar con el endpoint de Hetzner S3, intentando alternativas:', apiErr);
  }

  // 2. SECONDARY: If Supabase Storage is configured
  const cleanName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(cleanName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: blob.type || 'image/jpeg'
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .getPublicUrl(cleanName);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload fallback:', err);
    }
  }

  // 3. TERTIARY: Client-side local reader (fallback preview)
  if (typeof fileOrDataUrl === 'string') {
    return fileOrDataUrl;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo procesar el archivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsDataURL(blob);
  });
}
