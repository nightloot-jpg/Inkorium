import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.879.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.879.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_IMAGE_SIZE = 60 * 1024 * 1024;
const MAX_VIDEO_SIZE = 1024 * 1024 * 1024;
const MAX_AUDIO_SIZE = 250 * 1024 * 1024;
const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const ALLOWED_AUDIO = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/webm"]);

const ALLOWED_FOLDERS = new Map<string, Set<string>>([
  ["photos", ALLOWED_IMAGES],
  ["covers", ALLOWED_IMAGES],
  ["avatars", ALLOWED_IMAGES],
  ["post-media", new Set([...ALLOWED_IMAGES, ...ALLOWED_VIDEO])],
  ["videos", ALLOWED_VIDEO],
  ["music", ALLOWED_AUDIO],
]);
const OWNED_PREFIXES = [
  "photos",
  "covers",
  "avatars",
  "post-media",
  "videos",
  "music",
  "chat",
  "profile-media",
  "music-media",
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  statusText: status >= 400 ? "Error" : undefined,
  headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
});

function extension(fileName: string, contentType: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName === "jpeg" ? "jpg" : fromName;
  return contentType.split("/")[1] || "bin";
}

function isOwnedKey(key: string, userId: string): boolean {
  const safeKey = key.trim();
  if (!safeKey || safeKey.startsWith("/") || safeKey.includes("..")) return false;
  if (safeKey.startsWith(`${userId}/`)) return true;
  return OWNED_PREFIXES.some(prefix => safeKey.startsWith(`${prefix}/${userId}/`));
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const r2Endpoint = Deno.env.get("R2_ENDPOINT");
const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
const r2BucketName = Deno.env.get("R2_BUCKET_NAME");
const publicBase = Deno.env.get("R2_PUBLIC_BASE_URL")?.replace(/\/$/, "");
const s3 = r2Endpoint && r2AccessKeyId && r2SecretAccessKey
  ? new S3Client({
      region: "auto",
      endpoint: r2Endpoint,
      credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
    })
  : null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabaseUrl || !supabaseAnonKey || !s3 || !r2BucketName) return json({ error: "R2 no está configurado en la función." }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "No autenticado." }, 401);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Sesión no válida." }, 401);

  let body: { action?: string; folder?: string; fileName?: string; contentType?: string; size?: number; key?: string };
  try { body = await req.json(); } catch { return json({ error: "Cuerpo JSON inválido." }, 400); }

  try {
    if (body.action === "upload") {
      const folder = String(body.folder || "photos");
      const contentType = String(body.contentType || "");
      const size = Number(body.size || 0);
      const allowedTypes = ALLOWED_FOLDERS.get(folder);
      if (!allowedTypes) return json({ error: "Carpeta no permitida." }, 400);
      if (!allowedTypes.has(contentType)) return json({ error: "Tipo de archivo no compatible para esta carpeta." }, 400);
      const maxSize = folder === "music"
        ? MAX_AUDIO_SIZE
        : (folder === "videos" || folder === "post-media") && contentType.startsWith("video/")
          ? MAX_VIDEO_SIZE
          : MAX_IMAGE_SIZE;
      if (!Number.isFinite(size) || size <= 0 || size > maxSize) {
        return json({ error: `El archivo supera el máximo permitido de ${Math.round(maxSize / 1024 / 1024)} MB.` }, 400);
      }
      const key = `${folder}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension(body.fileName || "upload.bin", contentType)}`;
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: r2BucketName, Key: key, ContentType: contentType }),
        { expiresIn: 3600 },
      );
      return json({ key, uploadUrl, url: publicBase ? `${publicBase}/${key}` : null, expiresIn: 3600 });
    }

    if (body.action === "get") {
      const key = String(body.key || "");
      if (!isOwnedKey(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      return json({
        url: await getSignedUrl(s3, new GetObjectCommand({ Bucket: r2BucketName, Key: key }), { expiresIn: 3600 }),
        expiresIn: 3600,
      });
    }

    if (body.action === "delete") {
      const key = String(body.key || "");
      if (!isOwnedKey(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
      return json({ ok: true });
    }

    return json({ error: "Acción no soportada." }, 400);
  } catch (error) {
    console.error("R2 media function error", error);
    return json({ error: error instanceof Error ? error.message : "Error con Cloudflare R2." }, 500);
  }
});
