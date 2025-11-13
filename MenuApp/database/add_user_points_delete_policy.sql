-- Add DELETE policy for user_points table
-- Execute this script in Supabase SQL Editor

-- Allow users to delete their own points
CREATE POLICY "Users can delete own points" ON user_points
  FOR DELETE USING (auth.uid() = user_id);

-- Allow users to update their own points (optional, for future use)
CREATE POLICY "Users can update own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id);

