-- Keep photo metadata and relationships behind the same photo visibility rules.
-- The underlying photos SELECT policy is the source of truth: rows in these
-- related tables are visible only when their referenced photo is visible.

ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photo likes viewable by everyone" ON public.photo_likes;
DROP POLICY IF EXISTS "Photo comments viewable by everyone" ON public.photo_comments;
DROP POLICY IF EXISTS "Albums are viewable by everyone" ON public.photo_albums;
DROP POLICY IF EXISTS "Photo likes visible with photo" ON public.photo_likes;
DROP POLICY IF EXISTS "Photo comments visible with photo" ON public.photo_comments;
DROP POLICY IF EXISTS "Photo albums visible with photos" ON public.photo_albums;

CREATE POLICY "Photo likes visible with photo"
ON public.photo_likes
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_likes.photo_id
  )
);

CREATE POLICY "Photo comments visible with photo"
ON public.photo_comments
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_comments.photo_id
  )
);

CREATE POLICY "Photo albums visible with photos"
ON public.photo_albums
FOR SELECT
TO anon, authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.album_id = photo_albums.id
  )
);
