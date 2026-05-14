
-- Lock search_path explicitly (already set, but linter wants ALTER too)
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.get_primary_role(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Revoke public execute on SECURITY DEFINER helpers; allow only authenticated where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_primary_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
