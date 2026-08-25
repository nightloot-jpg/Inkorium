drop policy if exists "Select posts" on public.posts;
create policy "Select posts"
on public.posts for select to public
using (
  ((select auth.uid()) = author_id)
  or ((group_id is null) and (visibility = 'public'::post_visibility_type))
  or ((group_id is null) and (visibility = any (array['friends'::post_visibility_type, 'friends_only'::post_visibility_type])) and exists (
    select 1 from public.friendships
    where friendships.status = 'accepted'::friendship_status_type
      and (((friendships.user_id = (select auth.uid())) and (friendships.friend_id = posts.author_id))
        or ((friendships.friend_id = (select auth.uid())) and (friendships.user_id = posts.author_id)))
  ))
  or ((group_id is not null) and exists (
    select 1
    from public.groups g
    left join public.group_members gm
      on gm.group_id = g.id and gm.user_id = (select auth.uid())
    where g.id = posts.group_id
      and ((g.privacy_level <> 'secret'::group_privacy_type) or (gm.status = 'accepted'::group_member_status_type))
  ))
);

drop policy if exists "Authenticated authors can delete posts" on public.posts;
create policy "Authenticated authors can delete posts"
on public.posts for delete to authenticated
using ((select auth.uid()) = author_id);

drop policy if exists "Authenticated authors can update posts" on public.posts;
create policy "Authenticated authors can update posts"
on public.posts for update to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

drop policy if exists "Authenticated users can insert posts" on public.posts;
create policy "Authenticated users can insert posts"
on public.posts for insert to authenticated
with check ((select auth.uid()) = author_id);

drop policy if exists "Authenticated wall owners can delete posts" on public.posts;
create policy "Authenticated wall owners can delete posts"
on public.posts for delete to authenticated
using ((select auth.uid()) = target_profile_id);

drop policy if exists "Users can insert their own likes" on public.post_likes;
create policy "Users can insert their own likes"
on public.post_likes for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own likes" on public.post_likes;
create policy "Users can delete their own likes"
on public.post_likes for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Insert comments" on public.comments;
create policy "Insert comments"
on public.comments for insert to public
with check ((select auth.uid()) = author_id);

drop policy if exists "Update comments" on public.comments;
create policy "Update comments"
on public.comments for update to public
using ((select auth.uid()) = author_id);

drop policy if exists "Delete comments" on public.comments;
create policy "Delete comments"
on public.comments for delete to public
using ((select auth.uid()) = author_id);

drop policy if exists "Insert comment likes" on public.comment_likes;
create policy "Insert comment likes"
on public.comment_likes for insert to public
with check ((select auth.uid()) = user_id);

drop policy if exists "Delete comment likes" on public.comment_likes;
create policy "Delete comment likes"
on public.comment_likes for delete to public
using ((select auth.uid()) = user_id);

drop policy if exists "Insert post images" on public.post_images;
create policy "Insert post images"
on public.post_images for insert to public
with check (exists (
  select 1 from public.posts
  where posts.id = post_images.post_id
    and posts.author_id = (select auth.uid())
));

drop policy if exists "Insert post videos" on public.post_videos;
create policy "Insert post videos"
on public.post_videos for insert to public
with check (exists (
  select 1 from public.posts
  where posts.id = post_videos.post_id
    and posts.author_id = (select auth.uid())
));

drop policy if exists "Authenticated users can insert polls" on public.polls;
create policy "Authenticated users can insert polls"
on public.polls for insert to authenticated
with check ((select auth.uid()) = author_id);

drop policy if exists "Users can delete own polls" on public.polls;
create policy "Users can delete own polls"
on public.polls for delete to authenticated
using ((select auth.uid()) = author_id);

drop policy if exists "Authenticated users can insert poll options" on public.poll_options;
create policy "Authenticated users can insert poll options"
on public.poll_options for insert to authenticated
with check (exists (
  select 1 from public.polls p
  where p.id = poll_options.poll_id
    and p.author_id = (select auth.uid())
));

drop policy if exists "Authenticated users can insert poll votes" on public.poll_votes;
create policy "Authenticated users can insert poll votes"
on public.poll_votes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and not exists (
    select 1
    from public.poll_votes pv
    join public.poll_options po on pv.poll_option_id = po.id
    where po.poll_id = (
      select poll_options.poll_id from public.poll_options
      where poll_options.id = pv.poll_option_id
    )
      and pv.user_id = (select auth.uid())
  )
);