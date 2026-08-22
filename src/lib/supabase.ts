import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Supabase auto-refresh works while the browser tab is in the foreground.
// Refresh again when the app regains focus/visibility so Storage uploads do
// not reuse a stale access token after a long background period.
if (typeof window !== 'undefined') {
  let refreshInFlight: Promise<unknown> | null = null;

  const refreshSession = () => {
    if (document.visibilityState !== 'visible' || refreshInFlight) return;

    refreshInFlight = supabase.auth.refreshSession()
      .catch((error) => {
        console.warn('[Inkorium] No se pudo refrescar la sesión de Supabase', error);
      })
      .finally(() => {
        refreshInFlight = null;
      });
  };

  window.addEventListener('focus', refreshSession);
  document.addEventListener('visibilitychange', refreshSession);
  window.setInterval(refreshSession, 10 * 60 * 1000);
}
