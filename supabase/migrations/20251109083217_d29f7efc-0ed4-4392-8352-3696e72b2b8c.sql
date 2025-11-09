-- 1. Ensure app_user rows are created for all new auth users
-- This trigger already exists (handle_new_user), so we just ensure it's properly attached
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Backfill missing user_roles for existing server profiles
INSERT INTO public.user_roles (user_id, role)
SELECT sp.server_id, 'server'::user_role
FROM public.server_profile sp
LEFT JOIN public.user_roles ur ON ur.user_id = sp.server_id AND ur.role = 'server'
WHERE ur.user_id IS NULL
ON CONFLICT DO NOTHING;

-- 3. Backfill missing user_roles for existing owner profiles
INSERT INTO public.user_roles (user_id, role)
SELECT op.user_id, 'owner'::user_role
FROM public.owner_profile op
LEFT JOIN public.user_roles ur ON ur.user_id = op.user_id AND ur.role = 'owner'
WHERE ur.user_id IS NULL
ON CONFLICT DO NOTHING;

-- 4. Add unique constraint to prevent duplicate role assignments
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_role_key UNIQUE (user_id, role);