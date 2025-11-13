-- Fix RLS policies for YouTube cache tables
-- Run this if you get "row-level security policy" errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert to youtube_queries" ON youtube_queries;
DROP POLICY IF EXISTS "Allow public update to youtube_queries" ON youtube_queries;
DROP POLICY IF EXISTS "Allow public insert to youtube_videos" ON youtube_videos;
DROP POLICY IF EXISTS "Allow public update to youtube_videos" ON youtube_videos;
DROP POLICY IF EXISTS "Allow public delete to youtube_videos" ON youtube_videos;
DROP POLICY IF EXISTS "Allow public insert to youtube_query_keywords" ON youtube_query_keywords;
DROP POLICY IF EXISTS "Allow public delete to youtube_query_keywords" ON youtube_query_keywords;

-- Create write policies
CREATE POLICY "Allow public insert to youtube_queries" ON youtube_queries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to youtube_queries" ON youtube_queries
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert to youtube_videos" ON youtube_videos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to youtube_videos" ON youtube_videos
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to youtube_videos" ON youtube_videos
  FOR DELETE USING (true);

CREATE POLICY "Allow public insert to youtube_query_keywords" ON youtube_query_keywords
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete to youtube_query_keywords" ON youtube_query_keywords
  FOR DELETE USING (true);

