-- Keep photo interaction metadata aligned with photo visibility.
-- Users must be able to see a photo before they can read or modify its likes/comments.

ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photo likes viewable by everyone" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can insert their own photo likes" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can delete their own photo likes" ON public.photo_likes;
DROP POLICY IF EXISTS "Photo comments viewable by everyone" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can insert their own photo comments" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can update their own photo comments" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can delete their own photo comments" ON public.photo_comments;

CREATE POLICY "Photo likes visible with photo"
ON public.photo_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_likes.photo_id
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

CREATE POLICY "Users can like visible photos"
ON public.photo_likes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_likes.photo_id
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

CREATE POLICY "Users can remove their own photo likes"
ON public.photo_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Photo comments visible with photo"
ON public.photo_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_comments.photo_id
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

CREATE POLICY "Users can comment on visible photos"
ON public.photo_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_comments.photo_id
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

CREATE POLICY "Authors can update comments on visible photos"
ON public.photo_comments FOR UPDATE
TO authenticated
USING (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_comments.photo_id
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
)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete comments on visible photos"
ON public.photo_comments FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_comments.photo_id
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