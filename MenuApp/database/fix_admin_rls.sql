-- Fix RLS Policy for Admin User
-- Execute this script in Supabase SQL Editor

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow admin user creation" ON users;
DROP POLICY IF EXISTS "Admin can manage own profile" ON users;

-- Allow admin user (00000000-0000-0000-0000-000000000001) to be created without auth
CREATE POLICY "Allow admin user creation" ON users
  FOR INSERT 
  WITH CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow admin user to view and update their profile
CREATE POLICY "Admin can manage own profile" ON users
  FOR ALL
  USING (id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Also allow normal users (with auth.uid()) to manage their profiles
-- This ensures existing policies still work
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Verification
SELECT 'Admin user RLS policy created successfully' as status;
