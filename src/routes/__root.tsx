import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouter } from '@tanstack/react-router';
import appCss from '../styles/app.css?url';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { getAuthSession } from '../auth';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

import type { Session, User } from '@supabase/supabase-js';

export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
    session: Session | null;
    user: User | null;
  };
}

const queryClient = new QueryClient();

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const session = await getAuthSession();
    return {
      auth: {
        isAuthenticated: !!session,
        session: session,
        user: session?.user ?? null,
      },
    };
  },
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  component: () => {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);
    const { auth } = Route.useRouteContext();

    // Sync context to Zustand if needed, but not during render.
    // Auth context from SSR is the authoritative source.
    useEffect(() => {
        useAuthStore.setState({ user: auth.user, isAuthenticated: !!auth.user });
    }, [auth.user]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // For purely client-side session changes (like token refresh)
            // we can sync to store, and we should also invalidate router to keep context updated.
            setUser(session?.user ?? null);

            // Invalidate router context on auth changes if needed
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
               await router.invalidate();
            }
        });

        return () => subscription.unsubscribe();
    }, [setUser, router]);

    return (
      <QueryClientProvider client={queryClient}>
        <HeadContent />
        <Outlet />
        <Scripts />
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      </QueryClientProvider>
    );
  }

});
