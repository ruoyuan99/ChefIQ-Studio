-- Simple Admin RLS Fix
-- Execute this script in Supabase SQL Editor

-- Only add the admin user creation policy (most important)
CREATE POLICY "Allow admin user creation" ON users
  FOR INSERT 
  WITH CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow admin user to manage their profile
CREATE POLICY "Admin can manage own profile" ON users
  FOR ALL
  USING (id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Verification
SELECT 'Admin user policies added successfully' as status;
