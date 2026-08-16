-- Añadir columna target_profile_id a la tabla posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS target_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Actualizar función de búsqueda para excluir firmas (opcional, aunque es decisión de producto)
-- Aquí solo indexaremos posts donde target_profile_id es null para el buscador normal

-- Trigger para notificaciones cuando se hace una firma
CREATE OR REPLACE FUNCTION notify_on_wall_post()
RETURNS trigger AS $$
BEGIN
  IF NEW.target_profile_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.target_profile_id, NEW.author_id, 'wall_post', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurarnos de que el trigger no se duplique
DROP TRIGGER IF EXISTS trigger_notify_wall_post ON public.posts;

CREATE TRIGGER trigger_notify_wall_post
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_wall_post();

-- Políticas RLS para posts
-- (Normalmente los insert de posts tienen policy "Autores pueden crear posts")
-- Actualizamos la política existente si es necesario, o creamos una para permitir
-- borrar tu firma o borrar un post en tu muro.
CREATE POLICY "Users can delete posts on their wall"
ON public.posts FOR DELETE
TO authenticated
USING (target_profile_id = auth.uid());
