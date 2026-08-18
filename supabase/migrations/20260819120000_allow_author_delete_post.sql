CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
TO authenticated
USING (author_id = auth.uid());
