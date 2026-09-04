-- Inkorium security hardening
-- 1) Revoke public execution of the global search helper. Search must be performed through an authenticated, privacy-aware API.
revoke execute on function public.search_inkorium(text) from anon;

-- 2) Replace globally readable relationship metadata policies with policies that follow the parent object's visibility.
-- Helper: a photo is visible to the current user when its own photos policy would allow it.

 drop policy if exists "Photo comments visible with photo" on public.photo_comments;
 create policy "Photo comments visible with photo"
 on public.photo_comments for select
 using (
   exists (
     select 1
     from public.photos p
     where p.id = photo_comments.photo_id
       and (
         p.visibility = 'public'
         or p.user_id = auth.uid()
         or (
           p.visibility = 'friends'
           and exists (
             select 1 from public.friendships f
             where f.status = 'accepted'
               and ((f.user_id = auth.uid() and f.friend_id = p.user_id)
                 or (f.friend_id = auth.uid() and f.user_id = p.user_id))
           )
         )
         or (
           p.visibility = 'private'
           and exists (
             select 1 from public.photo_visibility_users pvu
             where pvu.photo_id = p.id and pvu.user_id = auth.uid()
           )
         )
       )
   )
 );

 drop policy if exists "Photo likes visible with photo" on public.photo_likes;
 create policy "Photo likes visible with photo"
 on public.photo_likes for select
 using (
   exists (
     select 1 from public.photos p
     where p.id = photo_likes.photo_id
       and (
         p.visibility = 'public'
         or p.user_id = auth.uid()
         or (p.visibility = 'friends' and exists (
           select 1 from public.friendships f
           where f.status = 'accepted'
             and ((f.user_id = auth.uid() and f.friend_id = p.user_id)
               or (f.friend_id = auth.uid() and f.user_id = p.user_id))
         ))
         or (p.visibility = 'private' and exists (
           select 1 from public.photo_visibility_users pvu
           where pvu.photo_id = p.id and pvu.user_id = auth.uid()
         ))
       )
   )
 );

 drop policy if exists "Photo tags viewable by everyone" on public.photo_tags;
 create policy "Photo tags follow photo visibility"
 on public.photo_tags for select
 using (
   exists (
     select 1 from public.photos p
     where p.id = photo_tags.photo_id
       and (
         p.visibility = 'public'
         or p.user_id = auth.uid()
         or (p.visibility = 'friends' and exists (
           select 1 from public.friendships f
           where f.status = 'accepted'
             and ((f.user_id = auth.uid() and f.friend_id = p.user_id)
               or (f.friend_id = auth.uid() and f.user_id = p.user_id))
         ))
         or (p.visibility = 'private' and exists (
           select 1 from public.photo_visibility_users pvu
           where pvu.photo_id = p.id and pvu.user_id = auth.uid()
         ))
       )
   )
 );

-- 3) Public album discovery must not reveal private-only albums just because a photo row exists.
drop policy if exists "Photo albums visible with photos" on public.photo_albums;
create policy "Photo albums visible with photos"
on public.photo_albums for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.photos p
    where p.album_id = photo_albums.id
      and (
        p.visibility = 'public'
        or (p.visibility = 'friends' and exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
            and ((f.user_id = auth.uid() and f.friend_id = p.user_id)
              or (f.friend_id = auth.uid() and f.user_id = p.user_id))
        ))
      )
  )
);

-- 4) Photo-specific allow-list rows should only be visible to the authorized user/owner.
drop policy if exists "Photo visibility users viewable to related" on public.photo_visibility_users;
create policy "Photo visibility users viewable to related"
on public.photo_visibility_users for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.photos p
    where p.id = photo_visibility_users.photo_id
      and p.user_id = auth.uid()
  )
);

-- 5) Profile view data is private to the profile owner. Keep the existing owner-only SELECT policy.

-- 6) Restrict public access to role metadata. Permissions and roles are authorization internals, not public social data.
drop policy if exists "Permissions viewable by all" on public.permissions;
create policy "Authenticated users can read permissions"
on public.permissions for select to authenticated
using (true);

drop policy if exists "Roles viewable by all" on public.roles;
create policy "Authenticated users can read roles"
on public.roles for select to authenticated
using (true);

drop policy if exists "Role permissions viewable by all" on public.role_permissions;
create policy "Authenticated users can read role permissions"
on public.role_permissions for select to authenticated
using (true);
