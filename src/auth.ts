import { createServerFn } from '@tanstack/react-start'
import { getHeader, setCookie } from 'vinxi/http'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { Database } from './types/supabase'

export const getAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'ey';

    const supabase = createServerClient<Database>(
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

    const { data: { session } } = await supabase.auth.getSession();
    return session;
})
