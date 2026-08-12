REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_friend_request() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_photo_comment() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_photo_like() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_wall_post() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.photo_owner(uuid) FROM public, anon, authenticated;