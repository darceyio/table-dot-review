-- Allow owners to insert their own organizations
-- Adds an RLS policy so authenticated owners can create an org row tied to themselves

CREATE POLICY "Owners can insert their orgs"
ON public.org
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid());
