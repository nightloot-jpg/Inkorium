import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
  };
}

const queryClient = new QueryClient();

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </QueryClientProvider>
  ),
});
