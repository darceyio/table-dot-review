-- Phase 1: Security Fixes - Remove role column from app_user
-- This prevents privilege escalation attacks by storing roles ONLY in user_roles table
ALTER TABLE public.app_user DROP COLUMN IF EXISTS role;

-- Update handle_new_user trigger to NOT assign role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.app_user (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$function$;

-- Phase 2: Database Schema Enhancements

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add first_name and last_name to app_user
ALTER TABLE public.app_user 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Create owner_profile table
CREATE TABLE IF NOT EXISTS public.owner_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  business_logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on owner_profile
ALTER TABLE public.owner_profile ENABLE ROW LEVEL SECURITY;

-- RLS policies for owner_profile
CREATE POLICY "Users can view their own owner profile"
ON public.owner_profile FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own owner profile"
ON public.owner_profile FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own owner profile"
ON public.owner_profile FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all owner profiles"
ON public.owner_profile FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view business info"
ON public.owner_profile FOR SELECT
USING (true);

-- Enhance server_profile table
ALTER TABLE public.server_profile 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS wallet_addresses JSONB DEFAULT '[]'::jsonb;

-- Add trigger for owner_profile updated_at
CREATE TRIGGER update_owner_profile_updated_at
BEFORE UPDATE ON public.owner_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();