import { useRouteContext } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  // Authoritative Source of Truth from TanStack Router context (which comes
  // from SSR via __root.beforeLoad).
  const context = useRouteContext({ from: '__root__' });

  // During hydration and standard renders, strictly rely on the server-provided
  // context to prevent hydration mismatch (#418).
  // Zustand store syncing is handled via effects in the root and should not
  // act as a fallback during the synchronous render cycle.
  const user: User | null = context.auth.user;
  const isAuthenticated = context.auth.isAuthenticated;

  return { user, isAuthenticated };
}
