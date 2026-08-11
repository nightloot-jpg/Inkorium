import { useRouteContext } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';

/**
 * Authentication source of truth for rendered UI.
 *
 * The Router context is populated by __root.beforeLoad on both SSR and the
 * initial client render, so it must be the only source used to decide what
 * HTML to render during hydration. Zustand remains available for client-side
 * auth events, but it must not be merged into the render-time auth value.
 */
export function useAuth() {
  const { auth } = useRouteContext({ from: '__root__' });

  return {
    user: auth.user as User | null,
    isAuthenticated: auth.isAuthenticated,
  };
}
