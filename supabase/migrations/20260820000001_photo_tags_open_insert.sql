-- The original insert policy only allowed self-tagging or the photo owner tagging others,
-- but the tagging UI lets any user search for and tag anyone in a photo they can view,
-- so most real taggings were being rejected by RLS. Widen it: any authenticated user can
-- create a tag, as long as they are honestly recorded as the one who tagged it.
DROP POLICY IF EXISTS "Users can tag themselves or photo owner can tag" ON public.photo_tags;

CREATE POLICY "Authenticated users can tag people in photos" ON public.photo_tags FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = tagged_by
);
