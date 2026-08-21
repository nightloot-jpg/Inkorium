create table if not exists public.profile_music_diary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.music_tracks(id) on delete restrict,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists idx_profile_music_diary_user_date
  on public.profile_music_diary(user_id, entry_date desc);

alter table public.profile_music_diary enable row level security;

drop policy if exists "diary_select_public" on public.profile_music_diary;
drop policy if exists "diary_insert_own" on public.profile_music_diary;
drop policy if exists "diary_update_own" on public.profile_music_diary;
drop policy if exists "diary_delete_own" on public.profile_music_diary;

create policy "diary_select_public"
  on public.profile_music_diary for select using (true);
create policy "diary_insert_own"
  on public.profile_music_diary for insert with check (auth.uid() = user_id);
create policy "diary_update_own"
  on public.profile_music_diary for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diary_delete_own"
  on public.profile_music_diary for delete using (auth.uid() = user_id);

insert into public.profile_music_diary (user_id, track_id, entry_date)
select user_id, track_id, current_date
from public.profile_song_of_day
where track_id is not null
on conflict (user_id, entry_date) do nothing;
