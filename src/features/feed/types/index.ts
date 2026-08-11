import type { Database } from '../../../types/supabase';

export type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  photos: Database['public']['Tables']['photos']['Row'][];
  comments: Array<Database['public']['Tables']['comments']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'];
  }>;
  likes: Database['public']['Tables']['likes']['Row'][];
  post_shares: Array<{ id: string }>;
};
