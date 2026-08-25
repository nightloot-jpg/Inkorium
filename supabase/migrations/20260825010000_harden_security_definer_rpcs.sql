-- Harden SECURITY DEFINER functions exposed through PostgREST.
-- Client-callable RPCs remain available to authenticated users only.
-- Trigger/helper functions are not callable directly by API roles.

-- Remove anonymous execution from all SECURITY DEFINER functions flagged by
-- Supabase security advisors. These functions should never be callable as anon.
REVOKE EXECUTE ON FUNCTION public.check_photo_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_profile_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_group() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_like() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_privacy_settings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_wall_post() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_unlike() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_friend_request() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_post_like() FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_profile_view(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;

-- Trigger/internal helpers do not need to be directly executable by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_group() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_like() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_privacy_settings() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_wall_post() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_unlike() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_friend_request() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_post_like() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- Explicitly keep the RPCs used by authenticated application flows available.
GRANT EXECUTE ON FUNCTION public.check_photo_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_profile_view(uuid) TO authenticated;

-- Pin SECURITY DEFINER search paths to avoid search_path manipulation.
ALTER FUNCTION public.check_photo_owner(uuid) SET search_path = public;
ALTER FUNCTION public.get_or_create_direct_chat(uuid) SET search_path = public;
ALTER FUNCTION public.get_profile_stats(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_group() SET search_path = public;
ALTER FUNCTION public.handle_new_like() SET search_path = public;
ALTER FUNCTION public.handle_new_privacy_settings() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_new_wall_post() SET search_path = public;
ALTER FUNCTION public.handle_unlike() SET search_path = public;
ALTER FUNCTION public.has_permission(text) SET search_path = public;
ALTER FUNCTION public.is_chat_participant(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.notify_friend_request() SET search_path = public;
ALTER FUNCTION public.notify_post_like() SET search_path = public;
ALTER FUNCTION public.record_profile_view(uuid) SET search_path = public;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
