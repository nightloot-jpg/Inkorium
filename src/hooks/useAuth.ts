import { useRouteContext } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useAuth() {
  // SSR & Initial Hydration Source of Truth
  const context = useRouteContext({ from: '__root__' });

  // Client Reactive State Source of Truth (Post-Hydration)
  const storeUser = useAuthStore((state) => state.user);

  // By using this effect, we wait until hydration finishes to switch the source of truth to the store
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const user: User | null = isHydrated ? (storeUser || context.auth.user) : context.auth.user;
  const isAuthenticated = !!user;

  return { user, isAuthenticated };
}
