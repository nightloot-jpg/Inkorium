-- Fix RLS policies for profiles table to allow search and friend management
-- This allows authenticated users to search profiles and manage friendships

-- First, ensure profiles table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Allow anyone (including anon) to view profiles - needed for search and friend requests
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also ensure friendships table has proper RLS (in case migration wasn't applied)
-- This is a safety check - the migration 20260824000000 should have created this
DO $$
BEGIN
    -- Check if friendships table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friendships' AND table_schema = 'public') THEN
        -- Enable RLS if not already
        ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
        DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
        DROP POLICY IF EXISTS "Users can update friendship status" ON public.friendships;
        DROP POLICY IF EXISTS "Users can delete friendships" ON public.friendships;
        
        -- Users can see their own friendships (both directions)
        CREATE POLICY "Users can view their friendships"
        ON public.friendships FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id OR auth.uid() = friend_id);

        -- Users can send friend requests
        CREATE POLICY "Users can send friend requests"
        ON public.friendships FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id AND user_id <> friend_id);

        -- Users can update their own friendship status (accept/block)
        CREATE POLICY "Users can update friendship status"
        ON public.friendships FOR UPDATE
        TO authenticated
        USING (auth.uid() = friend_id OR auth.uid() = user_id)
        WITH CHECK (auth.uid() = friend_id OR auth.uid() = user_id);

        -- Users can delete their friendships
        CREATE POLICY "Users can delete friendships"
        ON public.friendships FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id OR auth.uid() = friend_id);
    END IF;
END $$;

-- Grant permissions
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure messages table has proper RLS for chat
DROP POLICY IF EXISTS "Users can read their own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

CREATE POLICY "Users can read their own conversations"
ON public.messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);

CREATE POLICY "Recipients can mark messages as read"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;