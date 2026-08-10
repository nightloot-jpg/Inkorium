import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './types/supabase'

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

export const getAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
})

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) throw error

    return {
      user: authData.user,
      session: authData.session
        ? {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          }
        : null,
    }
  })

export const registerFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string; fullName: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    })
    if (error) throw error

    return {
      user: authData.user,
      session: authData.session
        ? {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          }
        : null,
    }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return { success: true }
})
