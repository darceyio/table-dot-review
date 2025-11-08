-- Allow users to update their own app_user profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_user' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
    ON public.app_user FOR UPDATE
    USING (id = auth.uid());
  END IF;
END $$;

-- Allow self-assignment of non-admin roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can self-assign non-admin roles'
  ) THEN
    CREATE POLICY "Users can self-assign non-admin roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
      user_id = auth.uid() AND role IN ('customer'::user_role, 'server'::user_role, 'owner'::user_role)
    );
  END IF;
END $$;