import type { Database } from '../../../types/supabase';

export type Inklog = Database['public']['Tables']['inklogs']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  comments: (Database['public']['Tables']['comments']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row']
  })[];
  likes: Database['public']['Tables']['likes']['Row'][];
};

export type Album = Database['public']['Tables']['albums']['Row'] & {
  photos: Database['public']['Tables']['photos']['Row'][];
};
