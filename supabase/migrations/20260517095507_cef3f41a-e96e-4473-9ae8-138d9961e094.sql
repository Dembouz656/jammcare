ALTER FUNCTION public.validate_doctor_availability() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.validate_doctor_availability() FROM anon, authenticated, public;