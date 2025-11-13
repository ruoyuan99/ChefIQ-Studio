-- Manual SQL script to clear all points activities
-- Execute this script in Supabase SQL Editor to manually clear all points

-- Option 1: Clear all points for a specific user (replace 'USER_ID_HERE' with actual user ID)
DELETE FROM user_points 
WHERE user_id = 'USER_ID_HERE';

-- Update user's total_points to 0
UPDATE users 
SET total_points = 0, updated_at = NOW()
WHERE id = 'USER_ID_HERE';

-- Option 2: Clear all daily_checkin records for a specific user
DELETE FROM user_points 
WHERE user_id = 'USER_ID_HERE' 
AND activity_type = 'daily_checkin';

-- Recalculate total_points after deleting daily_checkin records
UPDATE users 
SET total_points = (
  SELECT COALESCE(SUM(points), 0)
  FROM user_points
  WHERE user_id = users.id
),
updated_at = NOW()
WHERE id = 'USER_ID_HERE';

-- Option 3: Clear ALL points for ALL users (USE WITH CAUTION!)
-- DELETE FROM user_points;
-- UPDATE users SET total_points = 0, updated_at = NOW();

-- Option 4: View current points for a user (for debugging)
-- SELECT 
--   u.id,
--   u.email,
--   u.total_points,
--   COUNT(up.id) as activity_count,
--   SUM(up.points) as calculated_total
-- FROM users u
-- LEFT JOIN user_points up ON u.id = up.user_id
-- WHERE u.id = 'USER_ID_HERE'
-- GROUP BY u.id, u.email, u.total_points;

-- Option 5: View all daily_checkin records for a user
-- SELECT 
--   id,
--   activity_type,
--   description,
--   points,
--   created_at
-- FROM user_points
-- WHERE user_id = 'USER_ID_HERE'
-- AND activity_type = 'daily_checkin'
-- ORDER BY created_at DESC;

