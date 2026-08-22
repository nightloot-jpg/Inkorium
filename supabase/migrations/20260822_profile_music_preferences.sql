create table if not exists public.profile_music_favorite_artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  artist_name text not null,
  youtube_channel_id text,
  youtube_video_id text,
  cover_url text,
  created_at timestamptz not null default now(),
  unique (user_id, artist_name)
);

create index if not exists idx_profile_music_favorite_artists_user on public.profile_music_favorite_artists(user_id, created_at desc);

alter table public.profile_music_favorite_artists enable row level security;

drop policy if exists "favorite_artists_select_public" on public.profile_music_favorite_artists;
drop policy if exists "favorite_artists_insert_own" on public.profile_music_favorite_artists;
drop policy if exists "favorite_artists_update_own" on public.profile_music_favorite_artists;
drop policy if exists "favorite_artists_delete_own" on public.profile_music_favorite_artists;

create policy "favorite_artists_select_public" on public.profile_music_favorite_artists for select using (true);
create policy "favorite_artists_insert_own" on public.profile_music_favorite_artists for insert with check (auth.uid() = user_id);
create policy "favorite_artists_update_own" on public.profile_music_favorite_artists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorite_artists_delete_own" on public.profile_music_favorite_artists for delete using (auth.uid() = user_id);

create table if not exists public.profile_music_featured_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  playlist_id uuid not null references public.music_playlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, playlist_id)
);

create index if not exists idx_profile_music_featured_playlists_user on public.profile_music_featured_playlists(user_id, created_at desc);

alter table public.profile_music_featured_playlists enable row level security;

drop policy if exists "featured_playlists_select_public" on public.profile_music_featured_playlists;
drop policy if exists "featured_playlists_insert_own" on public.profile_music_featured_playlists;
drop policy if exists "featured_playlists_delete_own" on public.profile_music_featured_playlists;

create policy "featured_playlists_select_public" on public.profile_music_featured_playlists for select using (true);
create policy "featured_playlists_insert_own" on public.profile_music_featured_playlists for insert with check (auth.uid() = user_id);
create policy "featured_playlists_delete_own" on public.profile_music_featured_playlists for delete using (auth.uid() = user_id);
