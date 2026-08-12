CREATE TABLE public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_private boolean NOT NULL DEFAULT false,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.albums TO authenticated;
GRANT ALL ON public.albums TO service_role;

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their albums" ON public.albums
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public albums are viewable" ON public.albums
  FOR SELECT TO authenticated USING (is_private = false);

ALTER TABLE public.photos ADD COLUMN album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL;
CREATE INDEX photos_album_id_idx ON public.photos(album_id);
CREATE INDEX albums_user_id_idx ON public.albums(user_id);