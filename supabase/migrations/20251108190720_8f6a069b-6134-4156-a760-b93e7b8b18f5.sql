-- Drop the problematic policies
DROP POLICY IF EXISTS "Servers can view their own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Servers can update their own invitations" ON public.invitations;

-- Create a security definer function to get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id;
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Servers can view their own invitations"
ON public.invitations
FOR SELECT
USING (
  email = get_user_email(auth.uid())
  AND status = 'pending'
  AND expires_at > now()
);

CREATE POLICY "Servers can update their own invitations"
ON public.invitations
FOR UPDATE
USING (
  email = get_user_email(auth.uid())
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  status IN ('accepted', 'declined')
);