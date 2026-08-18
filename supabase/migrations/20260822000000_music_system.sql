-- Add user and source_type to music_tracks
ALTER TABLE public.music_tracks 
ADD COLUMN user_id uuid references public.profiles(id) on delete cascade,
ADD COLUMN source_type text not null default 'local' check (source_type in ('local', 'youtube')),
ADD COLUMN youtube_id text,
ADD COLUMN duration integer,
ADD COLUMN album text;

CREATE INDEX idx_music_tracks_user_id ON public.music_tracks(user_id);
CREATE INDEX idx_music_tracks_created_at ON public.music_tracks(created_at desc);

-- Allow authenticated users to insert/update/delete their own tracks
CREATE POLICY "Users can create tracks" ON public.music_tracks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tracks" ON public.music_tracks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tracks" ON public.music_tracks FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Create music_playlists table
CREATE TABLE public.music_playlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    description text,
    cover_url text,
    is_public boolean default true,
    created_at timestamptz not null default now()
);

ALTER TABLE public.music_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public playlists are viewable by everyone" ON public.music_playlists FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create playlists" ON public.music_playlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON public.music_playlists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON public.music_playlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_music_playlists_user_id ON public.music_playlists(user_id);


-- Create music_playlist_items table
CREATE TABLE public.music_playlist_items (
    id uuid primary key default gen_random_uuid(),
    playlist_id uuid references public.music_playlists(id) on delete cascade not null,
    track_id uuid references public.music_tracks(id) on delete cascade not null,
    position integer not null default 0,
    created_at timestamptz not null default now(),
    UNIQUE(playlist_id, track_id)
);

ALTER TABLE public.music_playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Playlist items are viewable if playlist is viewable" ON public.music_playlist_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.music_playlists p WHERE p.id = playlist_id AND (p.is_public = true OR p.user_id = auth.uid()))
);
CREATE POLICY "Users can modify items in their own playlists" ON public.music_playlist_items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.music_playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid())
);

CREATE INDEX idx_music_playlist_items_playlist_id ON public.music_playlist_items(playlist_id);


-- Create music_favorites table
CREATE TABLE public.music_favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    track_id uuid references public.music_tracks(id) on delete cascade not null,
    created_at timestamptz not null default now(),
    UNIQUE(user_id, track_id)
);

ALTER TABLE public.music_favorites ENABLE ROW LEVEL SECURITY;

-- Note: Favorites can be private or public depending on profile settings, but for now we let the user query them
-- We will restrict it to the owner, or if we want to show it on profile, we'll need a policy.
CREATE POLICY "Users can view own favorites" ON public.music_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can view favorites" ON public.music_favorites FOR SELECT TO authenticated USING (true); -- Inkorium is social, we might want friends to see favorites
CREATE POLICY "Users can insert own favorites" ON public.music_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.music_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_music_favorites_user_id ON public.music_favorites(user_id);


-- Create profile_song_of_day table
CREATE TABLE public.profile_song_of_day (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null UNIQUE,
    track_id uuid references public.music_tracks(id) on delete cascade not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

ALTER TABLE public.profile_song_of_day ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Song of day is viewable by everyone" ON public.profile_song_of_day FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own song of day" ON public.profile_song_of_day FOR ALL TO authenticated USING (auth.uid() = user_id);


-- Create music_activity table (for "Escuchando ahora" / "Compartido recientemente")
CREATE TABLE public.music_activity (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    track_id uuid references public.music_tracks(id) on delete cascade not null,
    action text not null check (action in ('listened', 'shared', 'saved', 'playlist_created')),
    created_at timestamptz not null default now()
);

ALTER TABLE public.music_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity is viewable by everyone" ON public.music_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own activity" ON public.music_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_music_activity_created_at ON public.music_activity(created_at desc);
CREATE INDEX idx_music_activity_user_id ON public.music_activity(user_id);


-- Insert storage bucket for music
INSERT INTO storage.buckets (id, name, public) VALUES ('music-media', 'music-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'music-media' );
CREATE POLICY "Authenticated users can upload music" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'music-media' AND (storage.foldername(name))[1] = auth.uid()::text );
CREATE POLICY "Users can update their own music" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'music-media' AND (storage.foldername(name))[1] = auth.uid()::text );
CREATE POLICY "Users can delete their own music" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'music-media' AND (storage.foldername(name))[1] = auth.uid()::text );

