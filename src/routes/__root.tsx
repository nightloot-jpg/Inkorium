import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import appCss from '../styles/app.css?url';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
  };
}

const queryClient = new QueryClient();

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: () => (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <Outlet />
      <Scripts />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </QueryClientProvider>
  ),
});
