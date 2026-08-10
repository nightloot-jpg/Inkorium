export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          type: string
          poll_data: Json | null
          link_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          type?: string
          poll_data?: Json | null
          link_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          type?: string
          poll_data?: Json | null
          link_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string | null
          inklog_id: string | null
          parent_id: string | null
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          inklog_id?: string | null
          parent_id?: string | null
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          inklog_id?: string | null
          parent_id?: string | null
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          inklog_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          inklog_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          inklog_id?: string | null
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          user_id: string
          album_id: string | null
          post_id: string | null
          url: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          album_id?: string | null
          post_id?: string | null
          url: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          album_id?: string | null
          post_id?: string | null
          url?: string
          caption?: string | null
          created_at?: string
        }
      }
      post_shares: {
        Row: { id: string; user_id: string; post_id: string; created_at: string }
        Insert: { id?: string; user_id: string; post_id: string; created_at?: string }
        Update: { id?: string; user_id?: string; post_id?: string; created_at?: string }
      }
      inklogs: {
        Row: { id: string; user_id: string; photo_url: string; caption: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; photo_url: string; caption?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; photo_url?: string; caption?: string | null; created_at?: string; updated_at?: string }
      }
      albums: {
        Row: { id: string; user_id: string; title: string; description: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; description?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; description?: string | null; created_at?: string; updated_at?: string }
      }
    }
  }
}
