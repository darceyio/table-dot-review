-- Fix get_user_email to return lowercase for case-insensitive comparison
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT LOWER(email) FROM auth.users WHERE id = _user_id;
$$;