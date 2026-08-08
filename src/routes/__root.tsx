import { HeadContent, Scripts, createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { AuthLayout } from '../components/layouts/AuthLayout'

import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Inkorium',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
      }
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState()

  // Conditionally render the layouts based on the route
  const authRoutes = ['/login', '/register', '/forgot-password', '/update-password']
  const isAuthRoute = authRoutes.some(route => routerState.location.pathname.startsWith(route))

  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {isAuthRoute ? (
          <AuthLayout>
              {children}
          </AuthLayout>
        ) : (
          <AppLayout>
            {children}
          </AppLayout>
        )}

        <Scripts />
      </body>
    </html>
  )
}
