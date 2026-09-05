-- ==============================================================================
-- Supabase Storage RLS Policies for the 'avatars' Bucket
-- ==============================================================================
-- Objective:
-- 1. Ensure the 'avatars' bucket exists and is marked public for fast CDN delivery.
-- 2. Allow ALL authenticated users to SELECT (read/view) any avatar.
-- 3. Allow anonymous/public users to SELECT (read/view) avatars so profiles render.
-- 4. Restrict INSERT, UPDATE, and DELETE (write access) exclusively to the object owner.
--
-- IMPORTANT NOTE ON SUPABASE PERMISSIONS:
-- Do NOT run "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;".
-- In Supabase, storage.objects is owned by 'supabase_storage_admin' and already
-- has RLS enabled by default. Running ALTER TABLE will cause error 42501.
-- ==============================================================================

-- Step 1: Ensure bucket exists and is public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Step 2: Remove any existing or conflicting avatar storage policies
drop policy if exists "Authenticated users can select avatar images" on storage.objects;
drop policy if exists "Public users can select avatar images" on storage.objects;
drop policy if exists "Allow authenticated read on avatars" on storage.objects;
drop policy if exists "Allow public read on avatars" on storage.objects;
drop policy if exists "Allow owner upload avatars" on storage.objects;
drop policy if exists "Allow owner update avatars" on storage.objects;
drop policy if exists "Allow owner delete avatars" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Authenticated users can update own avatars" on storage.objects;
drop policy if exists "Authenticated users can delete own avatars" on storage.objects;

-- Step 3: READ POLICY FOR ALL AUTHENTICATED USERS
-- Any authenticated user can read / view avatar files from the 'avatars' bucket.
create policy "Authenticated users can select avatar images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
);

-- Step 4: READ POLICY FOR PUBLIC / ANONYMOUS ACCESS (Optional but Recommended)
-- Allows public profile views, landing page previews, and guest browsing without 403/401 errors.
create policy "Public users can select avatar images"
on storage.objects
for select
to anon
using (
  bucket_id = 'avatars'
);

-- Step 5: INSERT POLICY (Restricted to Authenticated Owner)
-- Allows an authenticated user to upload a file only if:
--   a) The storage object owner matches the authenticated user ID, or
--   b) The filename/path starts with their user ID folder: (auth.uid()::text = (storage.foldername(name))[1])
create policy "Allow owner upload avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = owner::text
    or (storage.foldername(name))[1] = auth.uid()::text
    or owner is null -- Supabase automatically populates owner from JWT
  )
);

-- Step 6: UPDATE POLICY (Restricted strictly to Object Owner)
-- Only the user who created the file (or whose folder matches their auth.uid) can update it.
create policy "Allow owner update avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = owner::text
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = owner::text
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Step 7: DELETE POLICY (Restricted strictly to Object Owner)
-- Only the user who created the file can delete it.
create policy "Allow owner delete avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (
    auth.uid()::text = owner::text
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
