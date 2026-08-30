import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

if (typeof window !== 'undefined') {
  let refreshInFlight: Promise<unknown> | null = null;
  const refreshSession = async () => {
    if (document.visibilityState !== 'visible' || refreshInFlight) return;
    refreshInFlight = supabase.auth.refreshSession().finally(() => { refreshInFlight = null; });
    try { await refreshInFlight; } catch (error) { console.warn('[Inkorium] No se pudo refrescar la sesión', error); }
  };
  window.addEventListener('focus', refreshSession);
  document.addEventListener('visibilitychange', refreshSession);
  window.setInterval(refreshSession, 10 * 60 * 1000);
}
