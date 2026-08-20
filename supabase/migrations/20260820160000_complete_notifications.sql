-- Complete notification coverage for the current Inkorium schema.
-- The UI already subscribes to public.notifications in realtime; this migration
-- makes the database consistently emit notifications for the supported social
-- events and removes the duplicate like trigger.

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type notification_type,
  p_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_actor_id is null or p_user_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (user_id, actor_id, type, entity_id)
  values (p_user_id, p_actor_id, p_type, p_entity_id);
end;
$$;

-- Keep only one like trigger. The project previously had two triggers doing the
-- same insert, which could create duplicate like notifications.
drop trigger if exists on_new_like on public.post_likes;
drop trigger if exists on_post_like on public.post_likes;
drop function if exists public.notify_post_like();
drop function if exists public.handle_new_like();

create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author_id uuid;
begin
  select author_id into post_author_id
  from public.posts
  where id = new.post_id;

  perform public.create_notification(
    post_author_id,
    new.user_id,
    'like'::notification_type,
    new.post_id
  );

  return new;
end;
$$;

create trigger on_post_like
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

create or replace function public.handle_unlike()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where actor_id = old.user_id
    and type = 'like'::notification_type
    and entity_id = old.post_id;
  return old;
end;
$$;

-- -----------------------------------------------------------------------------
-- Comments and replies
-- -----------------------------------------------------------------------------

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author_id uuid;
  parent_author_id uuid;
begin
  select author_id into post_author_id
  from public.posts
  where id = new.post_id;

  if new.parent_comment_id is not null then
    select author_id into parent_author_id
    from public.comments
    where id = new.parent_comment_id;
  end if;

  if new.parent_comment_id is not null and parent_author_id is not null and parent_author_id <> new.author_id then
    perform public.create_notification(
      parent_author_id,
      new.author_id,
      'reply'::notification_type,
      new.id
    );
  elsif post_author_id is not null and post_author_id <> new.author_id then
    perform public.create_notification(
      post_author_id,
      new.author_id,
      'comment'::notification_type,
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_notify_post_comment on public.comments;
drop trigger if exists on_comment_notification on public.comments;
create trigger on_comment_notification
  after insert on public.comments
  for each row execute function public.notify_comment();

-- -----------------------------------------------------------------------------
-- Shares
-- -----------------------------------------------------------------------------

create or replace function public.notify_post_share()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  original_author_id uuid;
begin
  if new.shared_post_id is null then
    return new;
  end if;

  select author_id into original_author_id
  from public.posts
  where id = new.shared_post_id;

  perform public.create_notification(
    original_author_id,
    new.author_id,
    'share'::notification_type,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists on_post_share_notification on public.posts;
create trigger on_post_share_notification
  after insert on public.posts
  for each row
  when (new.shared_post_id is not null)
  execute function public.notify_post_share();

-- -----------------------------------------------------------------------------
-- Follows
-- -----------------------------------------------------------------------------

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    new.following_id,
    new.follower_id,
    'follow'::notification_type,
    new.following_id
  );
  return new;
end;
$$;

drop trigger if exists on_follow_notification on public.follows;
create trigger on_follow_notification
  after insert on public.follows
  for each row execute function public.notify_follow();

-- Remove the notification when the follow is removed, so a fresh follow can
-- generate a fresh notification.
create or replace function public.cleanup_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where actor_id = old.follower_id
    and user_id = old.following_id
    and type = 'follow'::notification_type
    and entity_id = old.following_id;
  return old;
end;
$$;

drop trigger if exists on_follow_delete_notification on public.follows;
create trigger on_follow_delete_notification
  after delete on public.follows
  for each row execute function public.cleanup_follow_notification();

-- -----------------------------------------------------------------------------
-- Direct messages
-- -----------------------------------------------------------------------------

create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_id)
  select cp.user_id, new.sender_id, 'message'::notification_type, new.id
  from public.chat_participants cp
  where cp.channel_id = new.channel_id
    and cp.user_id <> new.sender_id;

  return new;
end;
$$;

drop trigger if exists on_chat_message_notification on public.chat_messages;
create trigger on_chat_message_notification
  after insert on public.chat_messages
  for each row execute function public.notify_chat_message();

-- -----------------------------------------------------------------------------
-- Wall posts
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_wall_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    new.target_profile_id,
    new.author_id,
    'wall_post'::notification_type,
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_wall_post_created on public.posts;
create trigger on_wall_post_created
  after insert on public.posts
  for each row
  when (new.target_profile_id is not null)
  execute function public.handle_new_wall_post();

-- -----------------------------------------------------------------------------
-- Existing friendship notifications, normalized through the same helper.
-- -----------------------------------------------------------------------------

create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public.create_notification(
      new.friend_id,
      new.user_id,
      'friend_request'::notification_type,
      new.id
    );
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    perform public.create_notification(
      new.user_id,
      new.friend_id,
      'friend_accept'::notification_type,
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_friendship_change on public.friendships;
create trigger on_friendship_change
  after insert or update on public.friendships
  for each row execute function public.notify_friend_request();

-- -----------------------------------------------------------------------------
-- Performance / realtime support
-- -----------------------------------------------------------------------------

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

-- Ensure realtime can deliver notification INSERT/UPDATE events to the client.
-- The command is idempotent when the table is already part of the publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception
  when undefined_object then
    null;
end;
$$;
