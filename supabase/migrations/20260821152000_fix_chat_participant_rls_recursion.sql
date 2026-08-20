create or replace function public.is_chat_participant(p_channel_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.chat_participants
    where channel_id = p_channel_id
      and user_id = coalesce(p_user_id, auth.uid())
  );
$$;

revoke execute on function public.is_chat_participant(uuid, uuid) from public;
grant execute on function public.is_chat_participant(uuid, uuid) to authenticated;

drop policy if exists "Users can see participants of their channels" on public.chat_participants;
create policy "Users can see participants of their channels"
on public.chat_participants for select
to authenticated
using (public.is_chat_participant(channel_id, auth.uid()));

drop policy if exists "Users can view channels they participate in" on public.chat_channels;
create policy "Users can view channels they participate in"
on public.chat_channels for select
to authenticated
using (public.is_chat_participant(id, auth.uid()));

drop policy if exists "Users can view messages in their channels" on public.chat_messages;
create policy "Users can view messages in their channels"
on public.chat_messages for select
to authenticated
using (public.is_chat_participant(channel_id, auth.uid()));
