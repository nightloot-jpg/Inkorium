-- Optimize profile/music RLS policies without changing effective authorization.

-- music_playlist_items: keep a single SELECT policy and split write access
-- from the broad FOR ALL policy so SELECT is not evaluated twice.
drop policy if exists "Users can modify items in their own playlists" on public.music_playlist_items;

drop policy if exists "Playlist items are viewable if playlist is viewable" on public.music_playlist_items;

create policy "Playlist items are viewable if playlist is viewable"
on public.music_playlist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.music_playlists p
    where p.id = music_playlist_items.playlist_id
      and (p.is_public = true or p.user_id = (select auth.uid()))
  )
);

create policy "Users can insert items in their own playlists"
on public.music_playlist_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.music_playlists p
    where p.id = music_playlist_items.playlist_id
      and p.user_id = (select auth.uid())
  )
);

create policy "Users can update items in their own playlists"
on public.music_playlist_items
for update
to authenticated
using (
  exists (
    select 1
    from public.music_playlists p
    where p.id = music_playlist_items.playlist_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.music_playlists p
    where p.id = music_playlist_items.playlist_id
      and p.user_id = (select auth.uid())
  )
);

create policy "Users can delete items in their own playlists"
on public.music_playlist_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.music_playlists p
    where p.id = music_playlist_items.playlist_id
      and p.user_id = (select auth.uid())
  )
);

-- profile_song_of_day: public SELECT is already the intended read path;
-- make the owner policy write-only to avoid overlapping SELECT policies.
drop policy if exists "Users can manage own song of day" on public.profile_song_of_day;

create policy "Users can insert own song of day"
on public.profile_song_of_day
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own song of day"
on public.profile_song_of_day
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own song of day"
on public.profile_song_of_day
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Optimize the existing owner-only music policies with initplan-friendly auth.uid().
drop policy if exists "Users can create tracks" on public.music_tracks;
drop policy if exists "Users can update own tracks" on public.music_tracks;
drop policy if exists "Users can delete own tracks" on public.music_tracks;

create policy "Users can create tracks"
on public.music_tracks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own tracks"
on public.music_tracks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own tracks"
on public.music_tracks
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Optimize playlist owner policies.
drop policy if exists "Users can create playlists" on public.music_playlists;
drop policy if exists "Users can update own playlists" on public.music_playlists;
drop policy if exists "Users can delete own playlists" on public.music_playlists;
drop policy if exists "Public playlists are viewable by everyone" on public.music_playlists;

create policy "Public playlists are viewable by everyone"
on public.music_playlists
for select
to authenticated
using (is_public = true or (select auth.uid()) = user_id);

create policy "Users can create playlists"
on public.music_playlists
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own playlists"
on public.music_playlists
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own playlists"
on public.music_playlists
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Remove the redundant SELECT policy on favorites; public viewing policy
-- already intentionally makes the full favorites set visible to authenticated users.
drop policy if exists "Users can view own favorites" on public.music_favorites;

drop policy if exists "Users can insert own favorites" on public.music_favorites;
drop policy if exists "Users can delete own favorites" on public.music_favorites;

create policy "Users can insert own favorites"
on public.music_favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete own favorites"
on public.music_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);
