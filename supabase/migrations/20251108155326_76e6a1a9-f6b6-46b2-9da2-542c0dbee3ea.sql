-- Update get_user_role function to prioritize roles correctly
-- Priority: admin > owner > manager > server > customer
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'owner' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'server' THEN 4
      WHEN 'customer' THEN 5
    END
  LIMIT 1;
$$;