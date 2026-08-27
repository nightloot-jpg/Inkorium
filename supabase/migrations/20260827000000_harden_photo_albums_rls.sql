-- Keep photo album metadata aligned with the visibility of its photos.
-- An album is readable by its owner, or by users who can see at least
-- one photo contained in that album. This prevents a private photo album
-- from exposing its name, description or cover metadata through RLS.

ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Albums are viewable by everyone" ON public.photo_albums;

CREATE POLICY "Photo albums visible with photos"
ON public.photo_albums
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.album_id = photo_albums.id
      AND (
        p.visibility = 'public'
        OR p.user_id = auth.uid()
        OR (
          p.visibility = 'friends'
          AND EXISTS (
            SELECT 1
            FROM public.friendships f
            WHERE f.status = 'accepted'
              AND (
                (f.user_id = auth.uid() AND f.friend_id = p.user_id)
                OR (f.friend_id = auth.uid() AND f.user_id = p.user_id)
              )
          )
        )
        OR (
          p.visibility = 'private'
          AND EXISTS (
            SELECT 1
            FROM public.photo_visibility_users pvu
            WHERE pvu.photo_id = p.id
              AND pvu.user_id = auth.uid()
          )
        )
      )
  )
);
