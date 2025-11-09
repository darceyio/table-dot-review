-- Phase 1: Database Schema Additions for Table.Review

-- 1. Create tables table
CREATE TABLE IF NOT EXISTS public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.location(id) ON DELETE CASCADE,
  label text NOT NULL,
  qr_code_id uuid REFERENCES public.qr_code(id),
  created_at timestamptz DEFAULT now()
);

-- 2. Create visits table
CREATE TABLE IF NOT EXISTS public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES public.qr_code(id),
  venue_id uuid NOT NULL REFERENCES public.location(id),
  server_id uuid REFERENCES auth.users(id),
  table_id uuid REFERENCES public.tables(id),
  session_fingerprint text,
  is_local boolean DEFAULT false,
  is_international boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. Create venue_metrics_cache table
CREATE TABLE IF NOT EXISTS public.venue_metrics_cache (
  venue_id uuid PRIMARY KEY REFERENCES public.location(id) ON DELETE CASCADE,
  avg_tip_percent numeric,
  avg_rating_emoji text,
  total_reviews integer DEFAULT 0,
  total_tips numeric DEFAULT 0,
  return_rate_guess numeric,
  local_ratio numeric,
  intl_ratio numeric,
  last_calculated_at timestamptz DEFAULT now()
);

-- 4. Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.org(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, profile_id)
);

-- 5. Enhance location table (venues)
ALTER TABLE public.location
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('cafe', 'restaurant', 'bar', 'coworking')),
ADD COLUMN IF NOT EXISTS google_place_id text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_slug ON public.location(slug);

-- 6. Enhance review table
ALTER TABLE public.review
ADD COLUMN IF NOT EXISTS visit_id uuid REFERENCES public.visits(id),
ADD COLUMN IF NOT EXISTS rating_emoji text,
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comment text;

-- 7. Enhance qr_code table
ALTER TABLE public.qr_code
ADD COLUMN IF NOT EXISTS short_code text,
ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.tables(id);

-- Create unique index and constraint on short_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_code_short_code ON public.qr_code(short_code);

-- 8. RLS Policies for new tables

-- Tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all tables"
ON public.tables FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Owners can manage tables for their venues"
ON public.tables FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.location l
    WHERE l.id = tables.venue_id AND user_owns_org(auth.uid(), l.org_id)
  )
);

CREATE POLICY "Public can view tables"
ON public.tables FOR SELECT
TO public
USING (true);

-- Visits
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create visits"
ON public.visits FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view their own visits"
ON public.visits FOR SELECT
TO authenticated
USING (server_id = auth.uid());

CREATE POLICY "Owners can view visits for their venues"
ON public.visits FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.location l
    WHERE l.id = visits.venue_id AND user_owns_org(auth.uid(), l.org_id)
  )
);

CREATE POLICY "Admins can view all visits"
ON public.visits FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- Venue Metrics Cache
ALTER TABLE public.venue_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view venue metrics"
ON public.venue_metrics_cache FOR SELECT
TO public
USING (true);

CREATE POLICY "System can update metrics"
ON public.venue_metrics_cache FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- Organization Members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their org members"
ON public.organization_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.org o
    WHERE o.id = organization_members.organization_id AND o.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Members can view their own membership"
ON public.organization_members FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage all org members"
ON public.organization_members FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_venue_id ON public.visits(venue_id);
CREATE INDEX IF NOT EXISTS idx_visits_server_id ON public.visits(server_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON public.visits(created_at);
CREATE INDEX IF NOT EXISTS idx_review_visit_id ON public.review(visit_id);
CREATE INDEX IF NOT EXISTS idx_review_rating_emoji ON public.review(rating_emoji);
CREATE INDEX IF NOT EXISTS idx_location_latitude_longitude ON public.location(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_location_category ON public.location(category);
CREATE INDEX IF NOT EXISTS idx_location_is_featured ON public.location(is_featured);