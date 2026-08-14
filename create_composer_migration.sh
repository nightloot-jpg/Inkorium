#!/bin/bash
timestamp=$(date +%Y%m%d%H%M%S)
filename="supabase/migrations/${timestamp}_composer_media.sql"
cat > "$filename" << 'SQL'
-- Añadir campos multimedia y encuestas a posts
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS media_data jsonb,
  ADD COLUMN IF NOT EXISTS poll_id uuid;

-- Crear cubo de almacenamiento para post media si no existe en la base (se debe insertar por SQL si se puede, usamos bucket config usual)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para post-media
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'post-media' );
CREATE POLICY "Authenticated users can insert post-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'post-media' );
CREATE POLICY "Users can update their own post-media" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Users can delete their own post-media" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1] );


-- Tablas para encuestas
CREATE TABLE IF NOT EXISTS public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  order_index integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_option_id, user_id)
);

-- RLS para polls
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert polls" ON public.polls FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own polls" ON public.polls FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- RLS para poll_options
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert poll options" ON public.poll_options FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.author_id = auth.uid())
);

-- RLS para poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll votes are viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert poll votes" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT EXISTS (
    SELECT 1 FROM public.poll_votes pv 
    JOIN public.poll_options po ON pv.poll_option_id = po.id
    WHERE po.poll_id = (SELECT poll_id FROM public.poll_options WHERE id = poll_option_id)
    AND pv.user_id = auth.uid()
));

-- FK de post a poll
ALTER TABLE public.posts ADD CONSTRAINT posts_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE SET NULL;
SQL
echo "Migration created at $filename"
