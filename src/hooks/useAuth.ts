import { useRouteContext } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  // Authoritative Source of Truth from TanStack Router context (which comes
  // from SSR via __root.beforeLoad).
  const context = useRouteContext({ from: '__root__' });

  // During the brief window between `supabase.auth.setSession(...)` in the
  // login flow and the next `router.invalidate()` resolving, the router
  // context may still report the pre-login user while the Zustand store has
  // already been updated by the onAuthStateChange listener. Falling back to
  // the store here keeps the value stable across that window and prevents
  // a hydration mismatch (#418) where the client paints a different user
  // than the SSR markup did.
  const storeUser = useAuthStore((s) => s.user);
  const storeIsAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const user: User | null = context.auth.user ?? storeUser;
  const isAuthenticated = context.auth.isAuthenticated || storeIsAuthenticated;

  return { user, isAuthenticated };
}
