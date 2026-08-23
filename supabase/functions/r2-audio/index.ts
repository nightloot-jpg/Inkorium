import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.879.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.879.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS: Record<string, string> = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const ALLOWED_AUDIO = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/aac"]);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, statusText: status >= 400 ? "Error" : undefined, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
const extension = (fileName: string, contentType: string) => { const fromName = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, ""); if (fromName && ["mp3", "wav", "ogg", "m4a", "webm", "aac", "mp4"].includes(fromName)) return fromName; return contentType.split("/")[1]?.replace("x-", "") || "mp3"; };
const owned = (key: string, userId: string) => key.startsWith(`music/${userId}/`);
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const r2Endpoint = Deno.env.get("R2_ENDPOINT");
const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
const r2BucketName = Deno.env.get("R2_BUCKET_NAME");
const publicBase = Deno.env.get("R2_PUBLIC_BASE_URL")?.replace(/\/$/, "");
const s3 = r2Endpoint && r2AccessKeyId && r2SecretAccessKey ? new S3Client({ region: "auto", endpoint: r2Endpoint, credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey } }) : null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabaseUrl || !supabaseAnonKey || !s3 || !r2BucketName) return json({ error: "R2 no está configurado en la función." }, 500);
  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "No autenticado." }, 401);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Sesión no válida." }, 401);
  let body: { action?: string; fileName?: string; contentType?: string; size?: number; key?: string };
  try { body = await req.json(); } catch { return json({ error: "Cuerpo JSON inválido." }, 400); }
  try {
    if (body.action === "upload") {
      const contentType = body.contentType || "";
      const size = Number(body.size || 0);
      if (!ALLOWED_AUDIO.has(contentType)) return json({ error: "Formato no compatible. Usa MP3, WAV, OGG, M4A o AAC." }, 400);
      if (!Number.isFinite(size) || size <= 0 || size > MAX_AUDIO_SIZE) return json({ error: "El audio supera el máximo permitido de 50 MB." }, 400);
      const key = `music/${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension(body.fileName || "audio.mp3", contentType)}`;
      const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: r2BucketName, Key: key, ContentType: contentType }), { expiresIn: 3600 });
      return json({ key, uploadUrl, url: publicBase ? `${publicBase}/${key}` : null, expiresIn: 3600 });
    }
    if (body.action === "get") {
      const key = String(body.key || "");
      if (!owned(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      return json({ url: await getSignedUrl(s3, new GetObjectCommand({ Bucket: r2BucketName, Key: key }), { expiresIn: 3600 }), expiresIn: 3600 });
    }
    if (body.action === "delete") {
      const key = String(body.key || "");
      if (!owned(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
      return json({ ok: true });
    }
    return json({ error: "Acción no soportada." }, 400);
  } catch (error) {
    console.error("R2 audio function error", error);
    return json({ error: error instanceof Error ? error.message : "Error con Cloudflare R2." }, 500);
  }
});
