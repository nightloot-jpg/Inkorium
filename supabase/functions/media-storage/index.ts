import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.879.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.879.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://www.inkorium.es",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
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
  ["chat", new Set([...ALLOWED_IMAGES, ...ALLOWED_VIDEO])],
]);

const OWNED_PREFIXES = ["photos", "covers", "avatars", "post-media", "videos", "music", "profile-media", "music-media"];

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

function parseChatKey(key: string): { channelId: string; ownerId: string } | null {
  const parts = key.split("/");
  if (parts.length < 4 || parts[0] !== "chat") return null;
  const [, channelId, ownerId] = parts;
  if (!channelId || !ownerId) return null;
  return { channelId, ownerId };
}

async function isChatParticipant(supabase: ReturnType<typeof createClient>, channelId: string, userId: string) {
  const { data, error } = await supabase
    .from("chat_participants")
    .select("channel_id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const endpoint = Deno.env.get("HETZNER_S3_ENDPOINT")?.replace(/\/$/, "");
const region = Deno.env.get("HETZNER_S3_REGION") || "hel1";
const accessKeyId = Deno.env.get("HETZNER_S3_ACCESS_KEY_ID");
const secretAccessKey = Deno.env.get("HETZNER_S3_SECRET_ACCESS_KEY");
const bucketName = Deno.env.get("HETZNER_S3_BUCKET") || "inkorium-media";
const publicBase = Deno.env.get("HETZNER_S3_PUBLIC_BASE_URL")?.replace(/\/$/, "")
  || `https://${bucketName}.${region}.your-objectstorage.com`;

const s3 = endpoint && accessKeyId && secretAccessKey
  ? new S3Client({ region, endpoint, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: false })
  : null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabaseUrl || !supabaseAnonKey || !s3 || !bucketName) return json({ error: "Hetzner Object Storage no está configurado en la función." }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "No autenticado." }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Sesión no válida." }, 401);

  let body: { action?: string; folder?: string; fileName?: string; contentType?: string; size?: number; key?: string; channelId?: string };
  try { body = await req.json(); } catch { return json({ error: "Cuerpo JSON inválido." }, 400); }

  try {
    if (body.action === "upload") {
      const folder = String(body.folder || "photos");
      const contentType = String(body.contentType || "");
      const size = Number(body.size || 0);
      const allowedTypes = ALLOWED_FOLDERS.get(folder);
      if (!allowedTypes) return json({ error: "Carpeta no permitida." }, 400);
      if (!allowedTypes.has(contentType)) return json({ error: "Tipo de archivo no compatible para esta carpeta." }, 400);
      const maxSize = folder === "music" ? MAX_AUDIO_SIZE : (folder === "videos" || folder === "post-media") && contentType.startsWith("video/") ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (!Number.isFinite(size) || size <= 0 || size > maxSize) return json({ error: `El archivo supera el máximo permitido de ${Math.round(maxSize / 1024 / 1024)} MB.` }, 400);

      let key: string;
      if (folder === "chat") {
        const channelId = String(body.channelId || "").trim();
        if (!channelId) return json({ error: "Falta el canal del chat." }, 400);
        if (!(await isChatParticipant(supabase, channelId, user.id))) return json({ error: "No estás autorizado para subir archivos a este chat." }, 403);
        key = `chat/${channelId}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension(body.fileName || "upload.bin", contentType)}`;
      } else {
        key = `${folder}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension(body.fileName || "upload.bin", contentType)}`;
      }

      const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType }), { expiresIn: 3600 });
      return json({ key, uploadUrl, url: `${publicBase}/${key}`, expiresIn: 3600 });
    }

    if (body.action === "get") {
      const key = String(body.key || "").trim();
      const chatKey = parseChatKey(key);
      if (chatKey) {
        if (!(await isChatParticipant(supabase, chatKey.channelId, user.id))) return json({ error: "No estás autorizado para ver este archivo del chat." }, 403);
      } else if (!isOwnedKey(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucketName, Key: key }), { expiresIn: 3600 });
      return json({ url, expiresIn: 3600 });
    }

    if (body.action === "delete") {
      const key = String(body.key || "").trim();
      const chatKey = parseChatKey(key);
      if (chatKey) {
        if (chatKey.ownerId !== user.id) return json({ error: "Solo el autor puede borrar este archivo." }, 403);
        if (!(await isChatParticipant(supabase, chatKey.channelId, user.id))) return json({ error: "No estás autorizado para borrar este archivo del chat." }, 403);
      } else if (!isOwnedKey(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      return json({ ok: true });
    }

    return json({ error: "Acción no soportada." }, 400);
  } catch (error) {
    console.error("Hetzner media storage function error", error);
    return json({ error: error instanceof Error ? error.message : "Error con Hetzner Object Storage." }, 500);
  }
});
