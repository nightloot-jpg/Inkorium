create or replace function public.get_or_create_direct_chat(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_channel uuid;
begin
  if v_me is null then
    raise exception 'Authentication required';
  end if;
  if p_other_user is null or p_other_user = v_me then
    raise exception 'Invalid chat participant';
  end if;

  if not exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and ((f.user_id = v_me and f.friend_id = p_other_user)
        or (f.user_id = p_other_user and f.friend_id = v_me))
  ) then
    raise exception 'Direct chat requires an accepted friendship';
  end if;

  select cp1.channel_id
    into v_channel
  from public.chat_participants cp1
  join public.chat_participants cp2
    on cp2.channel_id = cp1.channel_id
   and cp2.user_id = p_other_user
  join public.chat_channels cc
    on cc.id = cp1.channel_id
  where cp1.user_id = v_me
    and cc.type = 'direct'
  limit 1;

  if v_channel is not null then
    return v_channel;
  end if;

  insert into public.chat_channels (type)
  values ('direct')
  returning id into v_channel;

  insert into public.chat_participants (channel_id, user_id, role)
  values
    (v_channel, v_me, 'member'),
    (v_channel, p_other_user, 'member');

  return v_channel;
end;
$$;

grant execute on function public.get_or_create_direct_chat(uuid) to authenticated;
