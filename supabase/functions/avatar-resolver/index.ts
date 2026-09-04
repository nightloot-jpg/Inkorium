import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "https://zllwzmfsfzfedorljgtg.supabase.co").replace(/\/$/, "");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
const HETZNER_HOST = "inkorium-media.hel1.your-objectstorage.com";
const LEGACY_HOST = "media.inkorium.es";
const ALLOWED_HOSTS = new Set([HETZNER_HOST, LEGACY_HOST, "images.unsplash.com"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const headers = (contentType?: string) => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  ...(contentType ? { "Content-Type": contentType } : {}),
});

function candidates(raw: string): string[] {
  const value = raw.trim();
  if (!value) return [];
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.host)) return [];
    const out: string[] = [];
    const pathname = url.pathname;

    if (url.host === LEGACY_HOST) {
      out.push(`https://${HETZNER_HOST}${pathname}${url.search}`);
      if (pathname.startsWith("/profile-media/")) {
        const rest = pathname.slice("/profile-media/".length);
        out.push(`https://${HETZNER_HOST}/avatars/${rest}${url.search}`);
        const parts = rest.split("/").filter(Boolean);
        if (parts.length > 1) out.push(`https://${HETZNER_HOST}/avatars/${parts[parts.length - 1]}${url.search}`);
      }
    } else {
      out.push(value);
    }
    return Array.from(new Set(out));
  } catch {
    return [];
  }
}

async function fetchImage(url: string): Promise<Response | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.host)) return null;
    const response = await fetch(url, {
      headers: { Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) return null;
    return response;
  } catch {
    return null;
  }
}

async function getProfile(id: string) {
  if (!SERVICE_ROLE_KEY) return null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id,avatar_url`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function repairAvatarUrl(id: string, canonicalUrl: string): Promise<void> {
  if (!SERVICE_ROLE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ avatar_url: canonicalUrl, updated_at: new Date().toISOString() }),
    });
  } catch {
    // Image serving must not fail because repair failed.
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: headers() });

  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop() || url.searchParams.get("id") || "";
    if (!UUID_RE.test(id)) return new Response(null, { status: 400, headers: headers() });

    const profile = await getProfile(id);
    if (!profile) return new Response(null, { status: 404, headers: headers() });

    const rawAvatar = String(profile.avatar_url || "").trim();
    const avatarCandidates = candidates(rawAvatar);
    for (const candidate of avatarCandidates) {
      const image = await fetchImage(candidate);
      if (!image) continue;

      const contentType = image.headers.get("content-type") || "image/jpeg";
      const bytes = new Uint8Array(await image.arrayBuffer());
      if (candidate !== rawAvatar) await repairAvatarUrl(id, candidate);

      return new Response(bytes, {
        status: 200,
        headers: {
          ...headers(contentType),
          "Content-Length": String(bytes.byteLength),
        },
      });
    }

    return new Response(null, { status: 404, headers: headers() });
  } catch {
    return new Response(null, { status: 404, headers: headers() });
  }
});
