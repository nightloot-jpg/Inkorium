CREATE TABLE IF NOT EXISTS public.user_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  youtube_video_id text,
  title text NOT NULL,
  thumbnail text,
  channel text,
  url text,
  source text NOT NULL DEFAULT 'youtube',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint para que no se puedan guardar vídeos de youtube repetidos por el mismo usuario
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_youtube_video ON public.user_videos (user_id, youtube_video_id) WHERE source = 'youtube';

ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos"
ON public.user_videos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
ON public.user_videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
ON public.user_videos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
ON public.user_videos FOR DELETE
USING (auth.uid() = user_id);
