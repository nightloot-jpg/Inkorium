-- In order for photo upload to work, the authenticated user must be able to upload to the "photos" storage bucket.

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects on "photos" bucket
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT USING (
    bucket_id = 'photos'
);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- We also make sure the RLS on public.photos is correct. It seems correct above:
-- CREATE POLICY "Users can insert their own photos" ON public.photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Just in case there is a mismatch on table creation.
