-- ========================================
-- SECURITY: Supabase Storage RLS Policies
-- ========================================
-- This file contains Row Level Security (RLS) policies for the Supabase Storage 'reports' bucket.
-- These policies enforce server-side validation for file uploads to prevent malicious files.
--
-- NOTE: File size limits should be enforced client-side as Supabase Storage RLS does not 
-- natively support octet_length checks on uploads via policy predicates.
--
-- Apply this file in Supabase SQL Editor after enabling RLS on storage.objects table.

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- POLICY 1: Allow authenticated users to upload images only
-- ===========================================
-- This policy restricts uploads to the 'reports' bucket to authenticated users
-- and enforces that only image files with allowed extensions can be uploaded.
-- 
-- Allowed extensions: .jpg, .jpeg, .png, .webp
-- Path patterns: avatars/* and reports/*
--
-- NOTE: This policy checks the file name extension, but magic byte validation
-- must be done client-side using the fileValidator.js utility.

CREATE POLICY "Authenticated users can upload images to reports bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND (
    name LIKE 'avatars/%'
    OR name LIKE 'reports/%'
  )
  AND (
    name ILIKE '%.jpg'
    OR name ILIKE '%.jpeg'
    OR name ILIKE '%.png'
    OR name ILIKE '%.webp'
  )
);

-- ===========================================
-- POLICY 2: Public read access for report images
-- ===========================================
-- Allow anyone to view images in the reports bucket (needed for public incident map)

CREATE POLICY "Public can view report images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'reports'
  AND name LIKE 'reports/%'
);

-- ===========================================
-- POLICY 3: Authenticated read access for avatars
-- ===========================================
-- Allow authenticated users to view avatar images

CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND name LIKE 'avatars/%'
);

-- ===========================================
-- POLICY 4: Users can update their own uploads
-- ===========================================
-- Allow users to update/delete only files they uploaded
-- This uses the owner_id column in storage.objects which is automatically set to auth.uid()

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reports'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'reports'
  AND owner = auth.uid()
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports'
  AND owner = auth.uid()
);

-- ===========================================
-- FILE SIZE ENFORCEMENT (CLIENT-SIDE REQUIRED)
-- ===========================================
-- Supabase Storage does not support checking file size in RLS policies.
-- File size limits MUST be enforced client-side:
--
-- - Avatar uploads: max 5MB (enforced in ProfileScreen.jsx)
-- - Report photo uploads: max 10MB per file (enforced in ReportModal.jsx via fileValidator.js)
--
-- For server-side size enforcement, consider:
-- 1. Using a Supabase Edge Function to intercept uploads
-- 2. Using storage bucket size limits (applies to total bucket size, not per-file)
-- 3. Implementing post-upload size checks via database triggers

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================
-- Test that policies are working correctly:

-- 1. Check that policies exist
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 2. Attempt to upload a file with invalid extension (should fail)
-- (Test this via Supabase client in your application)

-- 3. Verify public can read reports
-- (Test by accessing public URL without auth token)

-- 4. Verify authenticated users can access avatars
-- (Test by accessing avatar URL with valid auth token)
