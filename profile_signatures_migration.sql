create table if not exists public.profile_signatures (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists profile_signatures_profile_id_created_at_idx
  on public.profile_signatures(profile_id, created_at desc);

alter table public.profile_signatures enable row level security;

create policy "Profile signatures are publicly readable"
  on public.profile_signatures for select
  using (true);

create policy "Authenticated users can leave profile signatures"
  on public.profile_signatures for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can delete own profile signatures"
  on public.profile_signatures for delete
  to authenticated
  using (auth.uid() = author_id);
