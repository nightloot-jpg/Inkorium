import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.879.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.879.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_SIZE = 1024 * 1024 * 1024; // 1 GiB
const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 400 ? "Error" : undefined,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function extension(fileName: string, contentType: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && ["mp4", "webm", "ogg", "mov"].includes(fromName)) return fromName;
  return contentType === "video/quicktime" ? "mov" : contentType.split("/")[1] || "mp4";
}

function isOwnedKey(key: string, userId: string): boolean {
  return key.startsWith(`${userId}/`) && !key.includes("..") && !key.startsWith("/");
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const r2Endpoint = Deno.env.get("R2_ENDPOINT");
const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
const r2BucketName = Deno.env.get("R2_BUCKET_NAME");

const s3 = r2Endpoint && r2AccessKeyId && r2SecretAccessKey
  ? new S3Client({
      region: "auto",
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    })
  : null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!supabaseUrl || !supabaseAnonKey) return json({ error: "Supabase no está configurado en la función." }, 500);
  if (!s3 || !r2BucketName) return json({ error: "Cloudflare R2 no está configurado en Supabase." }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "No autenticado." }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Sesión no válida." }, 401);

  let body: { action?: string; fileName?: string; contentType?: string; size?: number; key?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Cuerpo JSON inválido." }, 400);
  }

  try {
    if (body.action === "upload") {
      const contentType = body.contentType || "";
      const size = Number(body.size || 0);
      if (!ALLOWED_TYPES.has(contentType)) return json({ error: "Formato no compatible. Usa MP4, WebM, OGG o MOV." }, 400);
      if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) {
        return json({ error: "El vídeo supera el máximo permitido de 1 GB." }, 400);
      }

      const ext = extension(body.fileName || "video.mp4", contentType);
      const key = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: r2BucketName,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: 60 * 60 },
      );

      return json({ key, uploadUrl, expiresIn: 3600 });
    }

    if (body.action === "get") {
      const key = String(body.key || "");
      if (!isOwnedKey(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: r2BucketName, Key: key }),
        { expiresIn: 60 * 60 },
      );
      return json({ url, expiresIn: 3600 });
    }

    if (body.action === "delete") {
      const key = String(body.key || "");
      if (!isOwnedKey(key, user.id)) return json({ error: "Objeto no autorizado." }, 403);
      await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
      return json({ ok: true });
    }

    return json({ error: "Acción no soportada." }, 400);
  } catch (error) {
    console.error("R2 video function error", error);
    return json({ error: error instanceof Error ? error.message : "Error al comunicarse con Cloudflare R2." }, 500);
  }
});
