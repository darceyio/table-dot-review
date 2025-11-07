-- Add public read policy for qr_code table
-- Customers need to scan QR codes and view server info without authentication

CREATE POLICY "Public users can view active QR codes"
ON qr_code
FOR SELECT
TO anon, authenticated
USING (is_active = true);