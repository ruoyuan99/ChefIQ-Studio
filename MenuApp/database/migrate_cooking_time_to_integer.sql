-- Migration: Convert cooking_time from TEXT to INTEGER (minutes)
-- This migration updates the cooking_time column to store minutes as integer
-- and migrates existing data from text format to integer format

-- Step 1: Add a new temporary column for integer cooking time
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cooking_time_minutes INTEGER;

-- Step 2: Migrate existing data from TEXT to INTEGER
-- Extract minutes from text formats like "20-30 minutes", "25 minutes", "1 hour", etc.
UPDATE recipes
SET cooking_time_minutes = (
  CASE
    -- If cooking_time is already a number (as string), convert directly
    WHEN cooking_time ~ '^\s*\d+\s*$' THEN 
      CAST(TRIM(cooking_time) AS INTEGER)
    
    -- Extract minutes from formats like "25 minutes", "30 min", "45m"
    WHEN cooking_time ~* '\d+\s*(min|minute|m)\b' THEN
      CAST((regexp_match(cooking_time, '(\d+)\s*(?:min|minute|m)', 'i'))[1] AS INTEGER)
    
    -- Extract hours and convert to minutes: "1 hour" = 60, "2 hours" = 120
    WHEN cooking_time ~* '\d+\s*(hour|hr|h)\b' AND NOT (cooking_time ~* '\d+\s*(min|minute|m)\b') THEN
      CAST((regexp_match(cooking_time, '(\d+)\s*(?:hour|hr|h)', 'i'))[1] AS INTEGER) * 60
    
    -- Extract hours and minutes: "1 hour 30 minutes" = 90
    WHEN cooking_time ~* '\d+\s*(hour|hr|h)\b' AND cooking_time ~* '\d+\s*(min|minute|m)\b' THEN
      COALESCE(
        CAST((regexp_match(cooking_time, '(\d+)\s*(?:hour|hr|h)', 'i'))[1] AS INTEGER) * 60,
        0
      ) + COALESCE(
        CAST((regexp_match(cooking_time, '(\d+)\s*(?:min|minute|m)', 'i'))[1] AS INTEGER),
        0
      )
    
    -- Extract first number from ranges like "20-30 minutes" (use lower number)
    WHEN cooking_time ~* '\d+\s*-\s*\d+' THEN
      CAST((regexp_match(cooking_time, '(\d+)\s*-', 'i'))[1] AS INTEGER)
    
    -- Extract any number as fallback
    WHEN cooking_time ~ '\d+' THEN
      CAST((regexp_match(cooking_time, '(\d+)'))[1] AS INTEGER)
    
    -- Default to NULL if can't parse
    ELSE NULL
  END
)
WHERE cooking_time IS NOT NULL AND cooking_time != '';

-- Step 3: Drop the old TEXT column
ALTER TABLE recipes DROP COLUMN IF EXISTS cooking_time;

-- Step 4: Rename the new column to cooking_time
ALTER TABLE recipes RENAME COLUMN cooking_time_minutes TO cooking_time;

-- Step 5: Add constraint to ensure cooking_time is between 1 and 999 minutes
ALTER TABLE recipes 
ADD CONSTRAINT cooking_time_range CHECK (cooking_time IS NULL OR (cooking_time >= 1 AND cooking_time <= 999));

-- Step 6: Add comment to document the column
COMMENT ON COLUMN recipes.cooking_time IS 'Cooking time in minutes (integer, 1-999)';

