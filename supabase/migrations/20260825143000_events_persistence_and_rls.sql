alter table public.events
  add column if not exists category text not null default 'Otros',
  add column if not exists city text;

create index if not exists events_start_time_idx on public.events (start_time);
create index if not exists events_creator_id_idx on public.events (creator_id);
create index if not exists event_attendees_event_id_idx on public.event_attendees (event_id);
create index if not exists event_attendees_user_id_idx on public.event_attendees (user_id);

create policy "Authenticated users can create events"
on public.events
for insert
to authenticated
with check (creator_id = auth.uid());

create policy "Creators can update events"
on public.events
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

create policy "Creators can delete events"
on public.events
for delete
to authenticated
using (creator_id = auth.uid());

create policy "Visible users can RSVP to events"
on public.event_attendees
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = event_id
  )
);

create policy "Users can update their own RSVP"
on public.event_attendees
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own RSVP"
on public.event_attendees
for delete
to authenticated
using (user_id = auth.uid());
