create table public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  audio_url text,
  cover_url text,
  created_at timestamptz not null default now()
);

alter table public.music_tracks enable row level security;

create policy "Public music tracks are viewable by everyone"
on public.music_tracks for select
to anon, authenticated
using (true);

grant select on public.music_tracks to anon, authenticated;

insert into public.music_tracks (title, artist)
values
  ('MHR, EFY & SNEZ! - Hola', 'MHR MUSIC'),
  ('Inalcanzable', 'Rels B, Duki'),
  ('Atardecer en Madrid', 'Inkorium Music'),
  ('Noches de verano', 'Inkorium Music');

create or replace function public.search_inkorium(search_text text)
returns table (
  kind text,
  id uuid,
  title text,
  subtitle text,
  content text,
  created_at timestamptz
)
language sql
stable
set search_path = public
as $$
  with q as (select '%' || lower(trim(search_text)) || '%' as term)
  select 'person'::text, p.id, coalesce(p.username, p.full_name, 'Usuario'), coalesce(p.city, p.bio, ''), null::text, p.updated_at
  from public.profiles p, q
  where trim(search_text) <> '' and (lower(coalesce(p.username, '')) like q.term or lower(coalesce(p.full_name, '')) like q.term or lower(coalesce(p.bio, '')) like q.term or lower(coalesce(p.city, '')) like q.term)
  union all
  select 'post'::text, p.id, coalesce(pr.username, pr.full_name, 'Usuario'), 'Publicación'::text, p.content, p.created_at
  from public.posts p left join public.profiles pr on pr.id = p.author_id, q
  where trim(search_text) <> '' and (lower(coalesce(p.content, '')) like q.term or lower(coalesce(pr.username, '')) like q.term or lower(coalesce(pr.full_name, '')) like q.term)
  union all
  select 'music'::text, m.id, m.title, m.artist, null::text, m.created_at
  from public.music_tracks m, q
  where trim(search_text) <> '' and (lower(m.title) like q.term or lower(m.artist) like q.term)
  union all
  select 'event'::text, e.id, e.name, coalesce(e.location_name, e.description, ''), e.description, e.start_time
  from public.events e, q
  where trim(search_text) <> '' and (lower(coalesce(e.name, '')) like q.term or lower(coalesce(e.description, '')) like q.term or lower(coalesce(e.location_name, '')) like q.term)
  order by 6 desc nulls last
  limit 50;
$$;

grant execute on function public.search_inkorium(text) to anon, authenticated;
