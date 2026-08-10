import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '../types/supabase'

/**
 * Server-only Supabase client.
 *
 * This file is suffixed `.server.ts` so the TanStack Start import-protection
 * plugin excludes it from the client bundle. The cookies-based session is
 * only meaningful on the server (where request cookies are available), so
 * this client must never be imported from client code.
 */
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'ey'

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Keep Supabase's cookie options intact. In particular, do not force
          // HttpOnly here: the browser Supabase client must be able to share
          // the same SSR session cookie after a server-side login.
          setCookie(name, value, options)
        })
      },
    },
  })
}
