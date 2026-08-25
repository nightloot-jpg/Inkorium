-- Chat membership is managed by the SECURITY DEFINER direct-chat RPC.
-- Do not allow clients to create arbitrary channels or add themselves to arbitrary channels.

drop policy if exists "Users can create direct chat channels" on public.chat_channels;
drop policy if exists "Users can join chat channels" on public.chat_participants;

drop policy if exists "Users can edit their own messages" on public.chat_messages;
drop policy if exists "Users can send messages to their channels" on public.chat_messages;

create policy "Authenticated users can edit their own messages"
on public.chat_messages
for update
to authenticated
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

create policy "Authenticated users can send messages to their channels"
on public.chat_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.chat_participants cp
    where cp.channel_id = chat_messages.channel_id
      and cp.user_id = auth.uid()
  )
);
