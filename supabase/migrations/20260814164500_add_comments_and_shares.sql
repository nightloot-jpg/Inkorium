-- Add shared_post_id to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
    ON public.post_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert comments"
    ON public.post_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
    ON public.post_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
    ON public.post_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Trigger for notifications when a comment is added
CREATE OR REPLACE FUNCTION notify_on_post_comment()
RETURNS trigger AS $$
DECLARE
    post_author_id uuid;
BEGIN
    -- Get the author of the post being commented on
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;

    -- Don't notify if the user comments on their own post
    IF NEW.author_id != post_author_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
        VALUES (post_author_id, NEW.author_id, 'comment', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_post_comment ON public.post_comments;

CREATE TRIGGER trigger_notify_post_comment
    AFTER INSERT ON public.post_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_post_comment();
