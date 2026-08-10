import { useRouteContext } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  // Authoritative Source of Truth from TanStack Router context (which comes from SSR)
  const context = useRouteContext({ from: '__root__' });

  const user: User | null = context.auth.user;
  const isAuthenticated = context.auth.isAuthenticated;

  return { user, isAuthenticated };
}
