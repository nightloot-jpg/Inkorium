import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://inkorium.es",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, range",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Vary": "Origin"
};

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers(corsHeaders);
  const contentType = upstream.headers.get("content-type");
  const contentRange = upstream.headers.get("content-range");
  const preferenceApplied = upstream.headers.get("preference-applied");
  if (contentType) headers.set("content-type", contentType);
  if (contentRange) headers.set("content-range", contentRange);
  if (preferenceApplied) headers.set("preference-applied", preferenceApplied);
  return headers;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const origin = req.headers.get("origin");
  if (origin && origin !== "https://inkorium.es") {
    return new Response(JSON.stringify({ error: "ORIGIN_NOT_ALLOWED" }), {
      status: 403,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  const authorization = req.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "AUTH_REQUIRED" }), {
      status: 401,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "SUPABASE_NOT_CONFIGURED" }), {
      status: 503,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  const url = new URL(req.url);
  const upstreamUrl = `${supabaseUrl}/rest/v1/private_messages${url.search}`;
  const upstreamHeaders: Record<string, string> = {
    apikey: supabaseKey,
    Authorization: authorization,
    Accept: req.headers.get("accept") || "application/json"
  };

  for (const name of ["content-type", "prefer", "range", "x-client-info"]) {
    const value = req.headers.get(name);
    if (value) upstreamHeaders[name] = value;
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: upstreamHeaders,
      body
    });

    const payload = await upstream.arrayBuffer();
    return new Response(payload, {
      status: upstream.status,
      headers: responseHeaders(upstream)
    });
  } catch (error) {
    console.error("private-messages proxy failed", error);
    return new Response(JSON.stringify({
      error: "PRIVATE_MESSAGES_PROXY_FAILED",
      message: error instanceof Error ? error.message : "Unable to reach Supabase."
    }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
