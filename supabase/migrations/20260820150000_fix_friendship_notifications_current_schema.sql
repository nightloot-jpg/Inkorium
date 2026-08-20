-- Keep friendship notifications aligned with the application schema.
-- The frontend uses friendships.user_id / friendships.friend_id.

create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (new.friend_id, new.user_id, 'friend_request', new.id);
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (new.user_id, new.friend_id, 'friend_accept', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_friendship_identity_columns on public.friendships;
drop function if exists public.sync_friendship_identity_columns();
