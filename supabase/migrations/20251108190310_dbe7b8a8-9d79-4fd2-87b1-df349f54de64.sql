-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.org(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  UNIQUE(org_id, email, status)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Owners can view invitations for their orgs
CREATE POLICY "Owners can view their org invitations"
ON public.invitations
FOR SELECT
USING (user_owns_org(auth.uid(), org_id));

-- Owners can create invitations for their orgs
CREATE POLICY "Owners can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (user_owns_org(auth.uid(), org_id));

-- Owners can update invitations for their orgs
CREATE POLICY "Owners can update their org invitations"
ON public.invitations
FOR UPDATE
USING (user_owns_org(auth.uid(), org_id));

-- Servers can view invitations sent to their email
CREATE POLICY "Servers can view their own invitations"
ON public.invitations
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
  AND expires_at > now()
);

-- Servers can accept/decline invitations sent to their email
CREATE POLICY "Servers can update their own invitations"
ON public.invitations
FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  status IN ('accepted', 'declined')
);

-- Create index for faster lookups
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_org_id ON public.invitations(org_id);