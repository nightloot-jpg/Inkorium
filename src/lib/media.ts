import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";

export async function uploadMedia(userId: string, file: File, folder: string) {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext || "jpg"}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function signMedia(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 6);
  if (error) throw error;
  return data.signedUrl;
}

export function useSignedUrl(path?: string | null) {
  return useQuery({
    queryKey: ["signed-url", path],
    queryFn: () => signMedia(path as string),
    enabled: Boolean(path),
    staleTime: 1000 * 60 * 60 * 4,
  });
}