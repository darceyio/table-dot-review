-- Create storage bucket for venue images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-images',
  'venue-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create venue_images table to track uploaded photos
CREATE TABLE IF NOT EXISTS public.venue_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.location(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.venue_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_images
CREATE POLICY "Public can view venue images"
  ON public.venue_images
  FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert images for their venues"
  ON public.venue_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.location l
      WHERE l.id = venue_images.venue_id
      AND user_owns_org(auth.uid(), l.org_id)
    )
  );

CREATE POLICY "Owners can update their venue images"
  ON public.venue_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.location l
      WHERE l.id = venue_images.venue_id
      AND user_owns_org(auth.uid(), l.org_id)
    )
  );

CREATE POLICY "Owners can delete their venue images"
  ON public.venue_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.location l
      WHERE l.id = venue_images.venue_id
      AND user_owns_org(auth.uid(), l.org_id)
    )
  );

-- Storage policies for venue-images bucket
CREATE POLICY "Public can view venue images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'venue-images');

CREATE POLICY "Owners can upload venue images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'venue-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Owners can update their venue images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'venue-images'
    AND auth.uid() = owner
  );

CREATE POLICY "Owners can delete their venue images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'venue-images'
    AND auth.uid() = owner
  );

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_venue_images_venue_id ON public.venue_images(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_images_display_order ON public.venue_images(venue_id, display_order);

-- Add updated_at trigger
CREATE TRIGGER update_venue_images_updated_at
  BEFORE UPDATE ON public.venue_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();