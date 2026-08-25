-- Security hardening for profile discovery and friendship state changes.
-- Keep public profiles available only to authenticated users and prevent a requester
-- from accepting/changing the state of their own pending request.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON public.profiles TO authenticated;
REVOKE SELECT ON public.profiles FROM anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'friendships'
  ) THEN
    ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can update their own friendship status" ON public.friendships;
    DROP POLICY IF EXISTS "Recipients can accept or block friend requests" ON public.friendships;

    CREATE POLICY "Recipients can accept or block friend requests"
    ON public.friendships FOR UPDATE
    TO authenticated
    USING (auth.uid() = friend_id)
    WITH CHECK (auth.uid() = friend_id);
  END IF;
END $$;
