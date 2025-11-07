-- =============================================
-- TEST DATA SEEDING MIGRATION (Fixed)
-- Creates test org, location, server profile, server assignment, and QR codes
-- =============================================

-- 1. Create Test Organization
INSERT INTO org (id, name, slug, owner_user_id, country, currency)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '[TEST] Demo Restaurant',
  'test-demo-restaurant',
  'c38b8210-5d2c-4cdf-839f-4b1dd821e5de',
  'US',
  'USD'
);

-- 2. Create Test Location
INSERT INTO location (id, org_id, name, address, timezone)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  '[TEST] Main Street Location',
  '123 Test Street, San Francisco, CA',
  'America/Los_Angeles'
);

-- 3. Temporarily promote your user to 'server' role for testing
UPDATE app_user 
SET role = 'server' 
WHERE id = 'c38b8210-5d2c-4cdf-839f-4b1dd821e5de';

-- 4. Create Server Profile (required before server_assignment)
INSERT INTO server_profile (server_id, bio, global_wallet_address)
VALUES (
  'c38b8210-5d2c-4cdf-839f-4b1dd821e5de',
  'Test server profile for Phase 1 validation',
  'darcey.eth'
);

-- 5. Create Server Assignment
INSERT INTO server_assignment (
  id, 
  server_id, 
  org_id, 
  location_id, 
  display_name_override,
  payout_wallet_address,
  is_active,
  started_at
)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'c38b8210-5d2c-4cdf-839f-4b1dd821e5de',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'Alice (Test Server)',
  'darcey.eth',
  true,
  now()
);

-- 6. Create Test QR Codes
INSERT INTO qr_code (id, code, server_assignment_id, is_active, deep_link_url)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'TEST01',
  'a0000000-0000-0000-0000-000000000003',
  true,
  '/r/TEST01'
);

INSERT INTO qr_code (id, code, server_assignment_id, is_active, deep_link_url)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'TEST02',
  'a0000000-0000-0000-0000-000000000003',
  true,
  '/r/TEST02'
);

-- 7. Create Owner Settings for Test Org
INSERT INTO owner_setting (id, org_id, email_alerts, digest_time, neg_review_threshold)
VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  false,
  '09:00:00',
  1
);