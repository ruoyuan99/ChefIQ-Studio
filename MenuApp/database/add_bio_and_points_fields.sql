-- Add bio field to users table and points tracking
-- Execute this script in Supabase SQL Editor

-- Add bio field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add points field to users table (optional, for quick access to total points)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Create user_points table for detailed points history (optional but recommended)
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_created_at ON user_points(created_at);

-- Enable RLS for user_points
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_points
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update comments RLS to allow viewing all comments for public recipes
DROP POLICY IF EXISTS "Anyone can view comments on public recipes" ON comments;
CREATE POLICY "Anyone can view comments on public recipes" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = comments.recipe_id 
      AND recipes.is_public = true
    )
  );

-- Allow users to view comments on their own recipes
DROP POLICY IF EXISTS "Users can view comments on own recipes" ON comments;
CREATE POLICY "Users can view comments on own recipes" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = comments.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- Allow authenticated users to add comments
DROP POLICY IF EXISTS "Authenticated users can add comments" ON comments;
CREATE POLICY "Authenticated users can add comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

