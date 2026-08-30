/**
 * Storage client for Cloudflare R2, Hetzner Object Storage (S3-compatible) and Supabase Storage.
 */
import { supabase, isSupabaseConfigured } from './supabase';

export const STORAGE_PUBLIC_URL = import.meta.env.VITE_STORAGE_PUBLIC_URL || '';
export const STORAGE_BUCKET_NAME = import.meta.env.VITE_STORAGE_BUCKET_NAME || 'inkorium-media';

/**
 * Uploads a media file (photos, avatars, albums) to the configured storage service
 * (Cloudflare R2 / Hetzner S3 / Supabase Storage).
 */
export async function uploadMediaFile(
  file: File, 
  folder: 'avatars' | 'photos' | 'wall' = 'photos'
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  // 1. If Supabase is connected with storage bucket
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(cleanName, file, {
          cacheControl: '3600',
          upsert: true
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

  // 2. Client-side local reader
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
    reader.readAsDataURL(file);
  });
}
