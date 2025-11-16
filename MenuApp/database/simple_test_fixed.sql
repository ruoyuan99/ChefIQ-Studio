-- 简单的数据库 Schema 测试（已修复外键问题）
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本

-- ============================================
-- 准备: 确保测试用户存在
-- ============================================
INSERT INTO users (id, email, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@test.com',
  'Test User'
)
ON CONFLICT (id) DO UPDATE SET name = 'Test User';

-- ============================================
-- 测试 1: 检查列类型（最重要）
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name IN ('cooking_time', 'servings')
ORDER BY column_name;

-- 预期结果:
-- cooking_time | integer | YES | NULL
-- servings     | integer | YES | YES | NULL

-- ============================================
-- 测试 2: 插入整数类型数据（应该成功）
-- ============================================
INSERT INTO recipes (
  title,
  description,
  cooking_time,  -- INTEGER (minutes)
  servings,      -- INTEGER
  cookware,
  is_public,
  user_id
) VALUES (
  'TEST_Schema_Check_' || EXTRACT(EPOCH FROM NOW()),
  '测试 Schema 更改 - 整数类型',
  25,  -- INTEGER
  4,   -- INTEGER
  'Regular Pan/Pot',
  false,
  '00000000-0000-0000-0000-000000000001'
) RETURNING 
  id, 
  title, 
  cooking_time, 
  servings,
  pg_typeof(cooking_time) AS cooking_time_type,
  pg_typeof(servings) AS servings_type;

-- 预期结果:
-- cooking_time: 25 (number)
-- servings: 4 (number)
-- cooking_time_type: integer
-- servings_type: integer

-- ============================================
-- 测试 3: 查询并验证数据类型
-- ============================================
SELECT 
  id,
  title,
  cooking_time,
  servings,
  pg_typeof(cooking_time) AS cooking_time_type,
  pg_typeof(servings) AS servings_type,
  CASE 
    WHEN pg_typeof(cooking_time) = 'integer' AND pg_typeof(servings) = 'integer'
    THEN '✅ 类型正确'
    ELSE '❌ 类型错误'
  END AS status
FROM recipes
WHERE title LIKE 'TEST_Schema_Check_%'
ORDER BY created_at DESC
LIMIT 5;

-- 预期结果: 所有行的 status 都应该是 "✅ 类型正确"

-- ============================================
-- 测试 4: 检查现有数据（如果有）
-- ============================================
SELECT 
  COUNT(*) AS total_recipes,
  COUNT(CASE WHEN pg_typeof(cooking_time) = 'integer' THEN 1 END) AS cooking_time_integer_count,
  COUNT(CASE WHEN pg_typeof(servings) = 'integer' THEN 1 END) AS servings_integer_count,
  COUNT(CASE WHEN pg_typeof(cooking_time) = 'integer' AND pg_typeof(servings) = 'integer' THEN 1 END) AS both_integer_count
FROM recipes;

-- 预期结果: 
-- cooking_time_integer_count 应该等于 total_recipes
-- servings_integer_count 应该等于 total_recipes
-- both_integer_count 应该等于 total_recipes

-- ============================================
-- 清理测试数据（可选）
-- ============================================
-- DELETE FROM recipes WHERE title LIKE 'TEST_Schema_Check_%';

-- ============================================
-- 总结
-- ============================================
-- 如果所有测试都通过：
-- ✅ cooking_time 和 servings 都是 integer 类型
-- ✅ 可以正常插入和查询整数类型数据
-- ✅ Schema 更改成功！

