-- Check and fix user_points table permissions
-- Execute this script in Supabase SQL Editor

-- Step 1: Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_points'
ORDER BY policyname;

-- Step 2: Drop existing policies (if needed)
DROP POLICY IF EXISTS "Users can view own points" ON user_points;
DROP POLICY IF EXISTS "Users can insert own points" ON user_points;
DROP POLICY IF EXISTS "Users can delete own points" ON user_points;
DROP POLICY IF EXISTS "Users can update own points" ON user_points;

-- Step 3: Create all necessary policies
-- SELECT: Users can view their own points
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can insert their own points
CREATE POLICY "Users can insert own points" ON user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own points
CREATE POLICY "Users can update own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can delete their own points
CREATE POLICY "Users can delete own points" ON user_points
  FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Verify policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_points'
ORDER BY policyname;

-- Step 5: Test delete permission (replace 'USER_ID_HERE' with actual user ID)
-- This should work if permissions are correct
-- DELETE FROM user_points WHERE user_id = 'USER_ID_HERE' AND auth.uid() = user_id;

-- Step 6: Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_points';

-- Step 7: Enable RLS if not already enabled
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

