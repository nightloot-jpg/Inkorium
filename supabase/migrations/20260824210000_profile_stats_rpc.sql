-- Public profile statistics RPC.
-- Keeps friendship rows private while exposing only aggregate counters.
CREATE OR REPLACE FUNCTION public.get_profile_stats(target_user_id uuid)
RETURNS TABLE (
  friends_count bigint,
  followers_count bigint,
  following_count bigint,
  albums_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT COUNT(DISTINCT CASE
        WHEN f.user_id = target_user_id THEN f.friend_id
        ELSE f.user_id
      END)
      FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (f.user_id = target_user_id OR f.friend_id = target_user_id)
    ) AS friends_count,
    (
      SELECT COUNT(*)
      FROM public.friendships f
      WHERE f.friend_id = target_user_id
        AND f.status = 'accepted'
    ) AS followers_count,
    (
      SELECT COUNT(*)
      FROM public.friendships f
      WHERE f.user_id = target_user_id
        AND f.status = 'accepted'
    ) AS following_count,
    (
      SELECT COUNT(*)
      FROM public.photo_albums a
      WHERE a.user_id = target_user_id
    ) AS albums_count;
$$;

REVOKE ALL ON FUNCTION public.get_profile_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO authenticated;
