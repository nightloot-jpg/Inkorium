-- Public bucket so uploaded videos can be played directly from Inkorium.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 209715200, array['video/mp4','video/webm','video/ogg','video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.user_videos add column if not exists description text;

create policy "Users can upload their own videos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can update their own videos"
on storage.objects for update
to authenticated
using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can delete their own videos"
on storage.objects for delete
to authenticated
using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Anyone can view uploaded videos"
on storage.objects for select
to public
using (bucket_id = 'videos');
