-- Direct messages between two users, used by the chat widget.
CREATE TABLE public.messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid references public.profiles(id) on delete cascade not null,
    recipient_id uuid references public.profiles(id) on delete cascade not null,
    content text not null check (char_length(content) > 0 and char_length(content) <= 2000),
    read_at timestamptz,
    created_at timestamptz not null default now()
);

CREATE INDEX idx_messages_conversation ON public.messages (
    least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at
);
CREATE INDEX idx_messages_recipient_unread ON public.messages (recipient_id, read_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);

CREATE POLICY "Recipients can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Enable realtime so the chat widget gets new messages instantly.
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
