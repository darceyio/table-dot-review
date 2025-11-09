-- Allow owners to create QR codes for their organizations
CREATE POLICY "Owners can create QR codes for their orgs"
ON qr_code
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM server_assignment sa
    WHERE sa.id = qr_code.server_assignment_id
    AND user_owns_org(auth.uid(), sa.org_id)
  )
);

-- Allow admins to create QR codes
CREATE POLICY "Admins can create QR codes"
ON qr_code
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = 'admin'::user_role
);