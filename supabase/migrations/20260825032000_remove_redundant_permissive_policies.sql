-- Remove redundant permissive SELECT/DELETE policies detected by the Supabase performance advisor.
-- Authorization remains unchanged because the remaining policies already cover the same cases.

drop policy if exists "Users can view own favorites" on public.music_favorites;
drop policy if exists "Select post likes" on public.post_likes;
drop policy if exists "Authors can delete their own posts" on public.posts;
