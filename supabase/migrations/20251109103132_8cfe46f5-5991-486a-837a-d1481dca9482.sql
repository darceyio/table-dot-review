-- Fix security warnings: Add search_path to functions

-- Fix generate_short_code function
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN substring(gen_random_uuid()::text FROM 1 FOR 8);
END;
$$;

-- Fix set_short_code trigger function
CREATE OR REPLACE FUNCTION set_short_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.short_code IS NULL THEN
    NEW.short_code := generate_short_code();
  END IF;
  RETURN NEW;
END;
$$;