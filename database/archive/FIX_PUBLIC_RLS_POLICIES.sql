-- Fix RLS: Allow anonymous/public reads on all citizen-facing data tables
-- Run this in Supabase SQL Editor
-- 
-- ROOT CAUSE: All client-side screens run without authentication (anonymous users).
-- Tables had RLS policies restricted to 'authenticated' role only, blocking all
-- public reads. This caused records encoded on admin side to NOT appear on client side.
--
-- SOLUTION: Add public SELECT policies with 'TO anon, authenticated' for all data tables
-- that need to be visible to citizens in the mobile app.

-- bfp_operations
DROP POLICY IF EXISTS "Public can view BFP operations" ON bfp_operations;
CREATE POLICY "Public can view BFP operations"
  ON bfp_operations FOR SELECT
  TO anon, authenticated
  USING (true);

-- cdrrmo_daily_operations  
DROP POLICY IF EXISTS "Public can view CDRRMO operations" ON cdrrmo_daily_operations;
CREATE POLICY "Public can view CDRRMO operations"
  ON cdrrmo_daily_operations FOR SELECT
  TO anon, authenticated
  USING (true);

-- agriculture_damage_reports
DROP POLICY IF EXISTS "Public can view agriculture damage reports" ON agriculture_damage_reports;
CREATE POLICY "Public can view agriculture damage reports"
  ON agriculture_damage_reports FOR SELECT
  TO anon, authenticated
  USING (true);

-- water_interruptions
DROP POLICY IF EXISTS "Public can view water interruptions" ON water_interruptions;
CREATE POLICY "Public can view water interruptions"
  ON water_interruptions FOR SELECT
  TO anon, authenticated
  USING (true);

-- power_interruptions
DROP POLICY IF EXISTS "Public can view power interruptions" ON power_interruptions;
CREATE POLICY "Public can view power interruptions"
  ON power_interruptions FOR SELECT
  TO anon, authenticated
  USING (true);

-- advisories (ensure public read for Published status)
DROP POLICY IF EXISTS "Public can view published advisories" ON advisories;
CREATE POLICY "Public can view published advisories"
  ON advisories FOR SELECT
  TO anon, authenticated
  USING (status = 'Published' OR auth.role() = 'authenticated');

-- hospital_daily_records (already has public read, ensure it exists)
DROP POLICY IF EXISTS "Public can view hospital records" ON hospital_daily_records;
CREATE POLICY "Public can view hospital records"
  ON hospital_daily_records FOR SELECT
  TO anon, authenticated
  USING (true);

-- VERIFICATION QUERY: Test if anonymous users can read from these tables
-- Run this after applying the above policies:
-- 
-- SELECT 
--   schemaname, 
--   tablename, 
--   policyname, 
--   roles, 
--   cmd
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN (
--     'bfp_operations',
--     'cdrrmo_daily_operations', 
--     'agriculture_damage_reports',
--     'water_interruptions',
--     'power_interruptions',
--     'advisories',
--     'hospital_daily_records'
--   )
--   AND cmd = 'SELECT'
-- ORDER BY tablename, policyname;
