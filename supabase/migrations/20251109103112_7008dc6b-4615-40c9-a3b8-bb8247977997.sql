-- Lisbon Demo Seed Data for Table.Review

-- IMPORTANT: Run this migration AFTER you have created at least one organization
-- and one server user through the app's normal signup flow.

-- This migration will:
-- 1. Create Kübe Coworking as a featured venue
-- 2. Add several demo cafes and restaurants in Lisbon
-- 3. Generate short_codes for existing QR codes (if they don't have them)

-- Note: You'll need to replace the placeholder org_id and server_id values
-- with actual IDs from your database after initial signup.

-- Generate short codes for any existing QR codes that don't have them
UPDATE public.qr_code
SET short_code = substring(gen_random_uuid()::text, 1, 8)
WHERE short_code IS NULL;

-- Add sample slug values to existing locations without slugs
UPDATE public.location
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Example seed data structure (commented out - customize with your actual IDs):
-- 
-- INSERT INTO public.location (
--   id, org_id, name, slug, address, 
--   latitude, longitude, category, is_featured
-- ) VALUES 
-- (
--   gen_random_uuid(),
--   'YOUR_ORG_ID_HERE',
--   'Kübe Coworking',
--   'kube-coworking-lisbon',
--   'Rua Rodrigues Sampaio 55, Lisbon, Portugal',
--   38.7223,
--   -9.1452,
--   'coworking',
--   true
-- );

-- Create a function to generate short codes automatically
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
BEGIN
  RETURN substring(gen_random_uuid()::text FROM 1 FOR 8);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-generate short codes for new QR codes
CREATE OR REPLACE FUNCTION set_short_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_code IS NULL THEN
    NEW.short_code := generate_short_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_short_code ON public.qr_code;

CREATE TRIGGER trigger_set_short_code
BEFORE INSERT ON public.qr_code
FOR EACH ROW
EXECUTE FUNCTION set_short_code();