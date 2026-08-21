DO $$
BEGIN
  DROP POLICY IF EXISTS "Select posts" ON public.posts;
END $$;

CREATE POLICY "Select posts"
ON public.posts
FOR SELECT
TO public
USING (
  auth.uid() = author_id
  OR (
    group_id IS NULL
    AND visibility = 'public'::post_visibility_type
  )
  OR (
    group_id IS NULL
    AND visibility IN (
      'friends'::post_visibility_type,
      'friends_only'::post_visibility_type
    )
    AND EXISTS (
      SELECT 1
      FROM public.friendships
      WHERE status = 'accepted'::friendship_status_type
        AND (
          (friendships.user_id = auth.uid() AND friendships.friend_id = posts.author_id)
          OR
          (friendships.friend_id = auth.uid() AND friendships.user_id = posts.author_id)
        )
    )
  )
  OR (
    group_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      LEFT JOIN public.group_members gm
        ON gm.group_id = g.id
       AND gm.user_id = auth.uid()
      WHERE g.id = posts.group_id
        AND (
          g.privacy_level <> 'secret'::group_privacy_type
          OR gm.status = 'accepted'::group_member_status_type
        )
    )
  )
);
