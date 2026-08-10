import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'ey';

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
