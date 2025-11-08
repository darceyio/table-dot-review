-- Allow anonymous (public) users to insert reviews that are tied to an active server assignment
-- and ensure the inserted org/location/server match the assignment. This keeps data consistent
-- while enabling the public flow without requiring authentication.

-- Enable RLS just in case (already enabled, but safe)
ALTER TABLE public.review ENABLE ROW LEVEL SECURITY;

-- Create a permissive INSERT policy for anon/authenticated roles with strict checks
DROP POLICY IF EXISTS "Public can create anonymous reviews via active assignment" ON public.review;
CREATE POLICY "Public can create anonymous reviews via active assignment"
ON public.review
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Only allow anonymous reviews from public flow
  is_anonymous = true
  AND EXISTS (
    SELECT 1
    FROM public.server_assignment sa
    WHERE sa.id = server_assignment_id
      AND sa.is_active = true
  )
  -- Ensure org/server/location match the referenced assignment (defensive consistency)
  AND org_id = (
    SELECT sa.org_id FROM public.server_assignment sa WHERE sa.id = server_assignment_id
  )
  AND server_id = (
    SELECT sa.server_id FROM public.server_assignment sa WHERE sa.id = server_assignment_id
  )
  AND (
    location_id IS NULL
    OR location_id = (
      SELECT sa.location_id FROM public.server_assignment sa WHERE sa.id = server_assignment_id
    )
  )
);
