const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const ALLOWED_ENDPOINTS = new Set(["search", "videos", "playlistItems"]);
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function clientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function allowedByRateLimit(req: Request) {
  const now = Date.now();
  const key = clientKey(req);
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!allowedByRateLimit(req)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "YouTube API is not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const incoming = new URL(req.url);
  const endpoint = incoming.pathname.split("/youtube-api/")[1]?.split("/")[0] || "";
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return new Response(JSON.stringify({ error: "Unsupported YouTube endpoint" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const youtubeUrl = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  for (const [key, value] of incoming.searchParams.entries()) {
    if (key === "key") continue;
    if (key === "maxResults") {
      const parsed = Math.min(Math.max(Number(value) || 10, 1), 50);
      youtubeUrl.searchParams.set(key, String(parsed));
    } else {
      youtubeUrl.searchParams.append(key, value);
    }
  }
  youtubeUrl.searchParams.set("key", apiKey);

  try {
    const response = await fetch(youtubeUrl, {
      headers: { Accept: "application/json" },
    });
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (error) {
    console.error("YouTube proxy error", error);
    return new Response(JSON.stringify({ error: "Unable to reach YouTube" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
