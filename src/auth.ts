import { createServerFn } from '@tanstack/react-start'
import { supabase } from './lib/supabase'

export const getAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
})
