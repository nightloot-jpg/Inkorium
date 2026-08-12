-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  mood text NOT NULL DEFAULT '',
  favorite_quote text NOT NULL DEFAULT '',
  avatar_url text,
  cover_url text,
  accent_color text NOT NULL DEFAULT '#73ffb8',
  bg_color text NOT NULL DEFAULT '#0a0a1a',
  is_private boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ FRIENDSHIPS ============
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_status_check CHECK (status IN ('pending','accepted')),
  CONSTRAINT friendships_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique UNIQUE (requester_id, addressee_id)
);
GRANT SELECT ON public.friendships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.requester_id = _a AND f.addressee_id = _b)
        OR (f.requester_id = _b AND f.addressee_id = _a))
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_profile(_owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _owner = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _owner AND p.is_private = false)
    OR public.are_friends(_owner, auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- friendships policies
CREATE POLICY "friendships_select" ON public.friendships FOR SELECT USING (true);
CREATE POLICY "friendships_insert_own" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "friendships_update_addressee" ON public.friendships FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid() OR requester_id = auth.uid())
  WITH CHECK (addressee_id = auth.uid() OR requester_id = auth.uid());
CREATE POLICY "friendships_delete_party" ON public.friendships FOR DELETE TO authenticated
  USING (addressee_id = auth.uid() OR requester_id = auth.uid());
CREATE TRIGGER friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PHOTOS ============
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photos_user_created_idx ON public.photos (user_id, created_at DESC);
GRANT SELECT ON public.photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_select_visible" ON public.photos FOR SELECT
  USING ((is_private = false AND public.can_view_profile(user_id)) OR user_id = auth.uid()
         OR (is_private = true AND public.are_friends(user_id, auth.uid())));
CREATE POLICY "photos_insert_own" ON public.photos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "photos_update_own" ON public.photos FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "photos_delete_own" ON public.photos FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.can_view_photo(_photo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.photos p
    WHERE p.id = _photo_id
      AND ((p.is_private = false AND public.can_view_profile(p.user_id))
        OR p.user_id = auth.uid()
        OR public.are_friends(p.user_id, auth.uid()))
  );
$$;

CREATE OR REPLACE FUNCTION public.photo_owner(_photo_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.photos WHERE id = _photo_id;
$$;

-- ============ PHOTO COMMENTS ============
CREATE TABLE public.photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photo_comments_photo_idx ON public.photo_comments (photo_id, created_at);
GRANT SELECT ON public.photo_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photo_comments TO authenticated;
GRANT ALL ON public.photo_comments TO service_role;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photo_comments_select" ON public.photo_comments FOR SELECT
  USING (public.can_view_photo(photo_id));
CREATE POLICY "photo_comments_insert" ON public.photo_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.can_view_photo(photo_id));
CREATE POLICY "photo_comments_delete" ON public.photo_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.photo_owner(photo_id) = auth.uid());

-- ============ PHOTO LIKES ============
CREATE TABLE public.photo_likes (
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (photo_id, user_id)
);
GRANT SELECT ON public.photo_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.photo_likes TO authenticated;
GRANT ALL ON public.photo_likes TO service_role;
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photo_likes_select" ON public.photo_likes FOR SELECT
  USING (public.can_view_photo(photo_id));
CREATE POLICY "photo_likes_insert" ON public.photo_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_view_photo(photo_id));
CREATE POLICY "photo_likes_delete" ON public.photo_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ STATUS UPDATES ============
CREATE TABLE public.status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX status_updates_user_idx ON public.status_updates (user_id, created_at DESC);
GRANT SELECT ON public.status_updates TO anon;
GRANT SELECT, INSERT, DELETE ON public.status_updates TO authenticated;
GRANT ALL ON public.status_updates TO service_role;
ALTER TABLE public.status_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "status_select" ON public.status_updates FOR SELECT
  USING (public.can_view_profile(user_id));
CREATE POLICY "status_insert_own" ON public.status_updates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "status_delete_own" ON public.status_updates FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ WALL POSTS ============
CREATE TABLE public.wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wall_posts_profile_idx ON public.wall_posts (profile_id, created_at DESC);
GRANT SELECT ON public.wall_posts TO anon;
GRANT SELECT, INSERT, DELETE ON public.wall_posts TO authenticated;
GRANT ALL ON public.wall_posts TO service_role;
ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wall_select" ON public.wall_posts FOR SELECT
  USING (public.can_view_profile(profile_id));
CREATE POLICY "wall_insert" ON public.wall_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.can_view_profile(profile_id));
CREATE POLICY "wall_delete" ON public.wall_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR profile_id = auth.uid());

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_no_self CHECK (sender_id <> recipient_id)
);
CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX messages_recipient_idx ON public.messages (recipient_id, read_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_party" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_update_recipient" ON public.messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ TOP FRIENDS ============
CREATE TABLE public.top_friends (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position smallint NOT NULL,
  PRIMARY KEY (profile_id, friend_id)
);
GRANT SELECT ON public.top_friends TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.top_friends TO authenticated;
GRANT ALL ON public.top_friends TO service_role;
ALTER TABLE public.top_friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "top_friends_select" ON public.top_friends FOR SELECT
  USING (public.can_view_profile(profile_id));
CREATE POLICY "top_friends_manage_own" ON public.top_friends FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============ BLOCKS ============
CREATE TABLE public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_select_own" ON public.blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());
CREATE POLICY "blocks_insert_own" ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blocks_delete_own" ON public.blocks FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_name text;
  candidate text;
  suffix int := 0;
BEGIN
  base_name := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'usuario'),
    '[^a-z0-9_]', '', 'g'));
  IF base_name = '' THEN base_name := 'usuario'; END IF;
  candidate := base_name;
  WHILE EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_name || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    candidate,
    coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', candidate),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ NOTIFICATION TRIGGERS ============
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.addressee_id, NEW.requester_id, 'friend_request', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.requester_id, NEW.addressee_id, 'friend_accepted', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER friendships_notify AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

CREATE OR REPLACE FUNCTION public.notify_photo_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.photos WHERE id = NEW.photo_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (owner_id, NEW.author_id, 'photo_comment', NEW.photo_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER photo_comments_notify AFTER INSERT ON public.photo_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_comment();

CREATE OR REPLACE FUNCTION public.notify_photo_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.photos WHERE id = NEW.photo_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (owner_id, NEW.user_id, 'photo_like', NEW.photo_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER photo_likes_notify AFTER INSERT ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_like();

CREATE OR REPLACE FUNCTION public.notify_wall_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.profile_id <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.profile_id, NEW.author_id, 'wall_post', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER wall_posts_notify AFTER INSERT ON public.wall_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_wall_post();

-- ============ PROFILE VIEW COUNTER ============
CREATE OR REPLACE FUNCTION public.increment_profile_view(_profile_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles SET view_count = view_count + 1 WHERE id = _profile_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_profile_view(uuid) TO anon, authenticated;

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;