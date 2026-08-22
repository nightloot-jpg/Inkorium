import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Server-side proxy for YouTube Data API v3.
// The API key is read only from the Supabase Edge Function secret and is never
// sent to or bundled into the browser.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENDPOINTS: Record<string, { path: string; allowedParams: string[]; defaults: Record<string, string> }> = {
  search: {
    path: "search",
    allowedParams: ["q", "type", "maxResults"],
    defaults: { part: "snippet" },
  },
  playlistItems: {
    path: "playlistItems",
    allowedParams: ["playlistId", "maxResults", "pageToken"],
    defaults: { part: "snippet" },
  },
  videos: {
    path: "videos",
    allowedParams: ["id"],
    defaults: { part: "contentDetails" },
  },
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return json({ error: "YOUTUBE_API_KEY no configurada en el servidor." }, 500);

  let body: { endpoint?: string; params?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Cuerpo JSON inválido." }, 400);
  }

  const config = body.endpoint ? ENDPOINTS[body.endpoint] : undefined;
  if (!config) return json({ error: `Endpoint no soportado: ${body.endpoint}` }, 400);

  const params = body.params && typeof body.params === "object" ? body.params : {};
  const url = new URL(`https://www.googleapis.com/youtube/v3/${config.path}`);
  for (const [key, value] of Object.entries(config.defaults)) url.searchParams.set(key, value);
  for (const key of config.allowedParams) {
    const value = params[key];
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  if (config.path === "search" && !url.searchParams.get("q")) {
    return json({ error: 'Falta el parámetro de búsqueda "q".' }, 400);
  }
  if (config.path === "playlistItems" && !url.searchParams.get("playlistId")) {
    return json({ error: 'Falta "playlistId".' }, 400);
  }
  if (config.path === "videos" && !url.searchParams.get("id")) {
    return json({ error: 'Falta "id".' }, 400);
  }

  if (url.searchParams.has("maxResults")) {
    const capped = Math.min(Math.max(Number(url.searchParams.get("maxResults")) || 12, 1), 25);
    url.searchParams.set("maxResults", String(capped));
  }
  url.searchParams.set("key", apiKey);

  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    if (!upstream.ok) {
      return json({ error: data?.error?.message || "Error al consultar YouTube." }, upstream.status);
    }

    return json({ items: data.items || [], nextPageToken: data.nextPageToken });
  } catch (error) {
    console.error("YouTube proxy error", error);
    return json({ error: error instanceof Error ? error.message : "Error inesperado al consultar YouTube." }, 502);
  }
});
