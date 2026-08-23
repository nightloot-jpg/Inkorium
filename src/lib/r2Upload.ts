import { supabase } from "./supabase";

type R2UploadFolder = "photos" | "covers" | "avatars" | "posts" | "chat";

type R2SignResponse = {
  key: string;
  uploadUrl: string;
  url: string | null;
  expiresIn: number;
  error?: string;
};

/**
 * Uploads an image to Cloudflare R2 through the `r2-media` edge function
 * (signed PUT URL) and returns the public URL + storage key.
 */
export async function uploadImageToR2(file: File, folder: R2UploadFolder): Promise<{ url: string; key: string }> {
  const { data, error } = await supabase.functions.invoke<R2SignResponse>("r2-media", {
    body: { action: "upload", folder, fileName: file.name, contentType: file.type, size: file.size },
  });
  if (error) throw error;
  if (!data?.uploadUrl || !data?.key || !data?.url) throw new Error(data?.error || "No se pudo preparar la subida a Cloudflare R2.");
  const response = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!response.ok) throw new Error(`Cloudflare R2 rechazó la subida (${response.status}).`);
  return { url: data.url, key: data.key };
}

/**
 * Uploads an audio file to Cloudflare R2 through the `r2-audio` edge function.
 */
export async function uploadAudioToR2(file: File): Promise<{ url: string; key: string }> {
  const { data, error } = await supabase.functions.invoke<R2SignResponse>("r2-audio", {
    body: { action: "upload", fileName: file.name, contentType: file.type, size: file.size },
  });
  if (error) throw error;
  if (!data?.uploadUrl || !data?.key || !data?.url) throw new Error(data?.error || "No se pudo preparar la subida a Cloudflare R2.");
  const response = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!response.ok) throw new Error(`Cloudflare R2 rechazó la subida (${response.status}).`);
  return { url: data.url, key: data.key };
}
