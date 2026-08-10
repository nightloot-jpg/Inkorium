import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
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
    const setUser = useAuthStore((state) => state.setUser);
    const { auth } = Route.useRouteContext();

    // Sync context to Zustand if needed, but not during render.
    // Auth context from SSR is the authoritative source.
    useEffect(() => {
        useAuthStore.setState({ user: auth.user, isAuthenticated: !!auth.user });
    }, [auth.user]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            // Only sync the client-side store. The router context is the
            // authoritative source (populated by __root.beforeLoad) and is
            // revalidated explicitly by login/register/logout flows. Calling
            // router.invalidate() here was the source of hydration mismatch
            // #418 because the re-render landed mid-transition and produced
            // a different `auth.user` between SSR markup and client paint.
            setUser(session?.user ?? null);
          }
        );

        return () => subscription.unsubscribe();
    }, [setUser]);

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
