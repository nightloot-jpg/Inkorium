CREATE TABLE public.photo_tags (
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  tagged_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tagger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (photo_id, tagged_id)
);

GRANT SELECT, INSERT, DELETE ON public.photo_tags TO authenticated;
GRANT SELECT ON public.photo_tags TO anon;
GRANT ALL ON public.photo_tags TO service_role;

ALTER TABLE public.photo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY photo_tags_select ON public.photo_tags
  FOR SELECT USING (public.can_view_photo(photo_id));

CREATE POLICY photo_tags_insert ON public.photo_tags
  FOR INSERT TO authenticated
  WITH CHECK (tagger_id = auth.uid() AND public.can_view_photo(photo_id));

CREATE POLICY photo_tags_delete ON public.photo_tags
  FOR DELETE TO authenticated
  USING (tagger_id = auth.uid() OR tagged_id = auth.uid() OR public.photo_owner(photo_id) = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.sender_id <> NEW.recipient_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.recipient_id, NEW.sender_id, 'message', NEW.id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER messages_notify
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message();

CREATE OR REPLACE FUNCTION public.notify_photo_tag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.tagged_id <> NEW.tagger_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.tagged_id, NEW.tagger_id, 'photo_tag', NEW.photo_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER photo_tags_notify
AFTER INSERT ON public.photo_tags
FOR EACH ROW EXECUTE FUNCTION public.notify_photo_tag();

CREATE OR REPLACE FUNCTION public.notify_new_photo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.is_private THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
  SELECT CASE WHEN f.requester_id = NEW.user_id THEN f.addressee_id ELSE f.requester_id END,
         NEW.user_id, 'photo_new', NEW.id
  FROM public.friendships f
  WHERE f.status = 'accepted'
    AND (f.requester_id = NEW.user_id OR f.addressee_id = NEW.user_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER photos_notify_new
AFTER INSERT ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.notify_new_photo();