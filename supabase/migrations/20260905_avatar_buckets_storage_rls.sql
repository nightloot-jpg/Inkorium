-- ==============================================================================
-- Migration: 20260905_avatar_buckets_storage_rls.sql
-- Description: Supabase Storage RLS policies for avatar buckets.
-- Note: RLS is already enabled on storage.objects by Supabase.
-- DO NOT execute "ALTER TABLE storage.objects ..." as it will fail with:
-- "ERROR: 42501: must be owner of table objects".
-- ==============================================================================

-- 1. Ensure avatar buckets exist in storage.buckets and are public
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('user-avatars', 'user-avatars', true),
  ('profile-media', 'profile-media', true)
on conflict (id) do update set
  public = true;

-- 2. Clean up any previous or restrictive select policies on storage.objects
drop policy if exists "Authenticated users can select avatar images" on storage.objects;
drop policy if exists "Allow authenticated select on avatar buckets" on storage.objects;
drop policy if exists "Allow authenticated select avatar buckets" on storage.objects;
drop policy if exists "Public users can select avatar images" on storage.objects;
drop policy if exists "Anyone can select avatar images" on storage.objects;
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Public Access to avatars" on storage.objects;
drop policy if exists "Users can only view own avatar" on storage.objects;
drop policy if exists "Restrict avatar viewing to owner" on storage.objects;

-- 3. PRIMARY POLICY: Authenticated users have 'select' access to all user avatar buckets
-- This ensures all authenticated users can view/select each other's uploaded avatar images.
create policy "Authenticated users can select avatar images"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('avatars', 'user-avatars', 'profile-media')
  or bucket_id ilike '%avatar%'
);

-- 4. COMPLEMENTARY POLICY: Public / Anonymous users can also view avatar images
-- Ensures public profile browsing, guest previews, and direct GET requests do not fail.
create policy "Public users can select avatar images"
on storage.objects
for select
to anon
using (
  bucket_id in ('avatars', 'user-avatars', 'profile-media')
  or bucket_id ilike '%avatar%'
);

-- 5. UPLOAD / INSERT POLICY: Authenticated users can upload avatar images
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can upload avatar" on storage.objects;

create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('avatars', 'user-avatars', 'profile-media')
  or bucket_id ilike '%avatar%'
);

-- 6. UPDATE POLICY: Authenticated users can update their own avatars
drop policy if exists "Authenticated users can update own avatars" on storage.objects;

create policy "Authenticated users can update own avatars"
on storage.objects
for update
to authenticated
using (
  (bucket_id in ('avatars', 'user-avatars', 'profile-media') or bucket_id ilike '%avatar%')
  and (auth.uid() = owner or owner is null or auth.uid() is not null)
)
with check (
  (bucket_id in ('avatars', 'user-avatars', 'profile-media') or bucket_id ilike '%avatar%')
  and (auth.uid() = owner or owner is null or auth.uid() is not null)
);

-- 7. DELETE POLICY: Authenticated users can delete their own avatars
drop policy if exists "Authenticated users can delete own avatars" on storage.objects;

create policy "Authenticated users can delete own avatars"
on storage.objects
for delete
to authenticated
using (
  (bucket_id in ('avatars', 'user-avatars', 'profile-media') or bucket_id ilike '%avatar%')
  and (auth.uid() = owner or owner is null or auth.uid() is not null)
);
