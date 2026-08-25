import type { Session } from '@supabase/supabase-js';

export type Profile = {
  id?: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  user_status: string | null;
  profile_interests?: string[] | null;
  profile_hashtag?: string | null;
};

export type ProfileViewProps = {
  session: Session;
  profile: Profile | null;
  profileId: string;
  username: string;
};

export type Signature = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
  created_at: string;
};

export type MediaTarget = 'avatar' | 'banner';
export type StatusValue = 'conectado' | 'ausente' | 'desconectado';

export type ProfileStats = {
  friends_count: number;
  followers_count: number;
  following_count: number;
  albums_count: number;
};
