-- Policy functions used by chat RLS must be executable by authenticated clients.
-- SECURITY DEFINER keeps the membership lookup isolated while allowing policies
-- to evaluate it during PostgREST requests.
grant execute on function public.is_chat_participant(uuid, uuid) to authenticated;
