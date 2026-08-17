-- Crear tabla para la privacidad de posts
CREATE TABLE IF NOT EXISTS public.post_visibility_users (
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);

-- RLS para la tabla post_visibility_users
ALTER TABLE public.post_visibility_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see visibility if they are the author"
ON public.post_visibility_users FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_visibility_users.post_id AND author_id = auth.uid())
);

CREATE POLICY "Users can see visibility if they are in the list"
ON public.post_visibility_users FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Authors can insert visibility users"
ON public.post_visibility_users FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_visibility_users.post_id AND author_id = auth.uid())
);

CREATE POLICY "Authors can delete visibility users"
ON public.post_visibility_users FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_visibility_users.post_id AND author_id = auth.uid())
);

-- Actualizar RLS de posts para manejar privacidad (public, friends, private)
-- Primero, necesitamos eliminar la política actual de "Public posts are viewable by everyone"
-- y las otras de vista que existan. En este caso vamos a hacer DROP de la de SELECT
-- si existe y crear nuevas.

DO $$
BEGIN
    -- Intentar eliminar la politica anterior de select
    BEGIN
        DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Nueva politica: los autores siempre pueden ver sus posts
CREATE POLICY "Authors can view own posts"
ON public.posts FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Nueva politica: todos pueden ver los posts publicos
CREATE POLICY "Public posts are viewable by everyone"
ON public.posts FOR SELECT
TO authenticated, anon
USING (visibility = 'public');

-- Nueva politica: los amigos pueden ver posts de amigos
CREATE POLICY "Friends can view friends posts"
ON public.posts FOR SELECT
TO authenticated
USING (
    visibility = 'friends' AND
    EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted' AND (
            (requester_id = auth.uid() AND addressee_id = posts.author_id) OR
            (addressee_id = auth.uid() AND requester_id = posts.author_id)
        )
    )
);

-- Nueva politica: los usuarios en la lista privada pueden ver el post
CREATE POLICY "Private users can view private posts"
ON public.posts FOR SELECT
TO authenticated
USING (
    visibility = 'private' AND
    EXISTS (
        SELECT 1 FROM public.post_visibility_users
        WHERE post_id = posts.id AND user_id = auth.uid()
    )
);
