-- Create Enum for Privacy if not exists (assume using text to be safe like posts)
-- Visibility: 'public', 'friends', 'private'

-- 1. Photo Albums
CREATE TABLE IF NOT EXISTS public.photo_albums (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    cover_photo_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Photos
CREATE TABLE IF NOT EXISTS public.photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    album_id uuid REFERENCES public.photo_albums(id) ON DELETE SET NULL,
    storage_path text NOT NULL,
    url text NOT NULL,
    caption text,
    visibility text NOT NULL DEFAULT 'public',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Photo Privacy (specific users allowed if private)
CREATE TABLE IF NOT EXISTS public.photo_visibility_users (
    photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (photo_id, user_id)
);

-- 4. Photo Likes
CREATE TABLE IF NOT EXISTS public.photo_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(photo_id, user_id)
);

-- 5. Photo Comments
CREATE TABLE IF NOT EXISTS public.photo_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Albums
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Albums are viewable by everyone" ON public.photo_albums FOR SELECT USING (true);
CREATE POLICY "Users can insert their own albums" ON public.photo_albums FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own albums" ON public.photo_albums FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own albums" ON public.photo_albums FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS: Photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own photos" ON public.photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own photos" ON public.photos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photos" ON public.photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Select Policy for Photos (mimicking post privacy)
CREATE POLICY "Photos visibility" ON public.photos FOR SELECT USING (
    visibility = 'public' 
    OR auth.uid() = user_id 
    OR (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friendships f 
        WHERE f.status = 'accepted' AND (
            (f.user_id = auth.uid() AND f.friend_id = photos.user_id) OR 
            (f.friend_id = auth.uid() AND f.user_id = photos.user_id)
        )
    ))
    OR (visibility = 'private' AND EXISTS (
        SELECT 1 FROM public.photo_visibility_users pvu 
        WHERE pvu.photo_id = id AND pvu.user_id = auth.uid()
    ))
);

-- RLS: Photo Visibility Users
ALTER TABLE public.photo_visibility_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photo visibility users viewable to related" ON public.photo_visibility_users FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.photos p WHERE p.id = photo_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users can insert visibility for own photos" ON public.photo_visibility_users FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.photos p WHERE p.id = photo_id AND p.user_id = auth.uid())
);

-- RLS: Photo Likes
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photo likes viewable by everyone" ON public.photo_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own photo likes" ON public.photo_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photo likes" ON public.photo_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS: Photo Comments
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photo comments viewable by everyone" ON public.photo_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own photo comments" ON public.photo_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own photo comments" ON public.photo_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own photo comments" ON public.photo_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
