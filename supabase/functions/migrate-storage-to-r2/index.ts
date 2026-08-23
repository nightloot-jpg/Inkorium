import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.879.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * One-off migration: copies existing files from Supabase Storage buckets
 * (post-media, music-media, photos [chat]) into Cloudflare R2, then updates
 * the referencing rows (posts.media_data, music_tracks, chat_messages) to
 * point at the new R2 public URL.
 *
 * Run in small batches to stay under the edge function time limit:
 *   POST { secret, bucket: "post-media" | "music-media" | "photos", offset, limit, dryRun }
 *
 * See supabase/functions/migrate-storage-to-r2/README.md for how to run it.
 */

const CORS_HEADERS: Record<string, string> = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, statusText: status >= 400 ? "Error" : undefined, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

const BUCKET_CONFIG = {
  "post-media": { r2Folder: "posts", onlyImages: true },
  "music-media": { r2Folder: "music", onlyImages: false },
  "photos": { r2Folder: "chat", onlyImages: true },
} as const;
type BucketName = keyof typeof BUCKET_CONFIG;

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const migrationSecret = Deno.env.get("MIGRATION_ADMIN_SECRET");
const r2Endpoint = Deno.env.get("R2_ENDPOINT");
const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
const r2BucketName = Deno.env.get("R2_BUCKET_NAME");
const publicBase = Deno.env.get("R2_PUBLIC_BASE_URL")?.replace(/\/$/, "");

const s3 = r2Endpoint && r2AccessKeyId && r2SecretAccessKey ? new S3Client({ region: "auto", endpoint: r2Endpoint, credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey } }) : null;

async function listAllFiles(supabase: ReturnType<typeof createClient>, bucket: string, prefix = ""): Promise<{ path: string; mimetype: string | null }[]> {
  const out: { path: string; mimetype: string | null }[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error) throw error;
  for (const entry of data || []) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Folders come back with id === null and no metadata.
    if (entry.id === null) {
      out.push(...await listAllFiles(supabase, bucket, fullPath));
    } else {
      out.push({ path: fullPath, mimetype: (entry.metadata as any)?.mimetype || null });
    }
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en la función." }, 500);
  if (!migrationSecret) return json({ error: "Falta configurar MIGRATION_ADMIN_SECRET en la función." }, 500);
  if (!s3 || !r2BucketName || !publicBase) return json({ error: "R2 no está configurado en la función." }, 500);

  let body: { secret?: string; bucket?: string; offset?: number; limit?: number; dryRun?: boolean };
  try { body = await req.json(); } catch { return json({ error: "Cuerpo JSON inválido." }, 400); }

  if (body.secret !== migrationSecret) return json({ error: "No autorizado." }, 401);
  const bucket = body.bucket as BucketName;
  if (!bucket || !(bucket in BUCKET_CONFIG)) return json({ error: "bucket debe ser post-media, music-media o photos." }, 400);

  const offset = Math.max(0, Number(body.offset || 0));
  const limit = Math.min(50, Math.max(1, Number(body.limit || 20)));
  const dryRun = body.dryRun !== false; // default true — must explicitly pass dryRun:false to write

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const config = BUCKET_CONFIG[bucket];

  let allFiles: { path: string; mimetype: string | null }[];
  try {
    allFiles = await listAllFiles(supabase, bucket);
  } catch (error) {
    return json({ error: `No se pudo listar el bucket ${bucket}: ${error instanceof Error ? error.message : error}` }, 500);
  }
  if (config.onlyImages) allFiles = allFiles.filter((f) => !f.mimetype || f.mimetype.startsWith("image/"));

  const page = allFiles.slice(offset, offset + limit);
  const results: { path: string; status: string; newUrl?: string; detail?: string }[] = [];

  for (const file of page) {
    const oldUrl = supabase.storage.from(bucket).getPublicUrl(file.path).data.publicUrl;
    const r2Key = `${config.r2Folder}/${file.path}`;
    const newUrl = `${publicBase}/${r2Key}`;
    try {
      if (!dryRun) {
        const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(file.path);
        if (downloadError || !blob) throw downloadError || new Error("descarga vacía");
        const bytes = new Uint8Array(await blob.arrayBuffer());
        await s3.send(new PutObjectCommand({ Bucket: r2BucketName, Key: r2Key, Body: bytes, ContentType: file.mimetype || blob.type || "application/octet-stream" }));

        if (bucket === "post-media") {
          await supabase.from("posts").update({ media_data: { type: "photo", url: newUrl } }).eq("media_data->>url", oldUrl).eq("media_data->>type", "photo");
        } else if (bucket === "music-media") {
          await supabase.from("music_tracks").update({ audio_url: newUrl, youtube_id: null }).eq("source_type", "local").eq("youtube_id", file.path);
        } else if (bucket === "photos") {
          await supabase.from("chat_messages").update({ content: newUrl }).eq("type", "image").eq("content", oldUrl);
        }
      }
      results.push({ path: file.path, status: dryRun ? "would-migrate" : "migrated", newUrl });
    } catch (error) {
      results.push({ path: file.path, status: "error", detail: error instanceof Error ? error.message : String(error) });
    }
  }

  return json({
    bucket,
    dryRun,
    total: allFiles.length,
    offset,
    limit,
    nextOffset: offset + limit < allFiles.length ? offset + limit : null,
    done: offset + limit >= allFiles.length,
    results,
  });
});
