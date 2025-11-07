-- Add public read policies for QR code flow
-- These allow anonymous users to view server and org info when scanning QR codes

-- Allow public read of active server assignments
CREATE POLICY "Public users can view active server assignments"
ON server_assignment
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow public read of orgs (for venue name display)
CREATE POLICY "Public users can view orgs"
ON org
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public read of locations (for venue location display)
CREATE POLICY "Public users can view locations"
ON location
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public read of server profiles (for server name display)
CREATE POLICY "Public users can view server profiles"
ON server_profile
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public read of app_user display names (for server name display)
CREATE POLICY "Public users can view user display names"
ON app_user
FOR SELECT
TO anon, authenticated
USING (true);