-- Profile "Sobre mí" customization
alter table public.profiles
  add column if not exists profile_interests text[] not null default array['Música','Gaming','Fotografía','Cine']::text[];
