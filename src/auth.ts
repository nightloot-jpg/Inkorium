import { createServerFn } from '@tanstack/react-start'
import { getHeader, setCookie } from 'vinxi/http'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { Database } from './types/supabase'

export function getSupabaseServerClient() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'ey';

    return createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
               try {
                   const cookieHeader = getHeader('cookie') || '';
                   return parseCookieHeader(typeof cookieHeader === 'string' ? cookieHeader : '');
               } catch (e) {
                   return [];
               }
            },
            setAll(cookiesToSet) {
               try {
                   cookiesToSet.forEach(({ name, value, options }) => {
                     setCookie(name, value, {
                        path: '/',
                        ...options,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                     });
                   });
               } catch (e) {
                   // ignored
               }
            },
          },
        }
    );
}

export const getAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
});

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });
    if (error) throw error;
    return { user: authData.user };
});

export const registerFn = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.fullName,
            },
        },
    });
    if (error) throw error;
    return { user: authData.user };
});

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
});
