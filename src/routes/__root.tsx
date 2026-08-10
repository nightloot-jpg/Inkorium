import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import appCss from '../styles/app.css?url';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { getAuthSession } from '../auth';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
    const { auth } = Route.useRouteContext();
    const setUser = useAuthStore((state) => state.setUser);
    const [isInitialized, setIsInitialized] = useState(false);

    if (!isInitialized) {
        setUser(auth.user);
        setIsInitialized(true);
    }

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

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
