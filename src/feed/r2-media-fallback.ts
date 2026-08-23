import { supabase } from "../lib/supabase";

const R2_HOSTS = [".r2.dev", ".r2.cloudflarestorage.com"];
const RETRIED_ATTR = "data-r2-fallback-tried";

function extractR2Key(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (!R2_HOSTS.some((suffix) => parsed.hostname.endsWith(suffix))) return null;
    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch {
    return null;
  }
}

async function getAuthHeaders() {
  const current = await supabase.auth.getSession();
  let session = current.data.session;
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    session = refreshed.data.session;
  }
  if (!session?.access_token) throw new Error("No hay una sesión válida para recuperar el media de R2.");
  return { Authorization: `Bearer ${session.access_token}` };
}

async function getSignedUrl(key: string): Promise<string> {
  const headers = await getAuthHeaders();
  const { data, error } = await supabase.functions.invoke("r2-media", {
    body: { action: "get", key },
    headers,
  });
  if (error) throw error;
  if (!data?.url) throw new Error("R2 no devolvió una URL firmada.");
  return data.url as string;
}

function shouldHandle(target: EventTarget | null): target is HTMLImageElement | HTMLVideoElement {
  return target instanceof HTMLImageElement || target instanceof HTMLVideoElement;
}

async function handleMediaError(target: HTMLImageElement | HTMLVideoElement) {
  const src = target.currentSrc || target.getAttribute("src") || "";
  if (!src || target.hasAttribute(RETRIED_ATTR)) return;

  const key = extractR2Key(src);
  if (!key) return;

  target.setAttribute(RETRIED_ATTR, "1");
  try {
    const signedUrl = await getSignedUrl(key);
    target.setAttribute("src", signedUrl);
    if (target instanceof HTMLVideoElement) {
      target.load();
      void target.play().catch(() => undefined);
    }
  } catch (error) {
    console.warn("[Inkorium] No se pudo recuperar el media de R2", { key, error });
  }
}

window.addEventListener(
  "error",
  (event) => {
    if (!shouldHandle(event.target)) return;
    void handleMediaError(event.target);
  },
  true,
);

export {};
