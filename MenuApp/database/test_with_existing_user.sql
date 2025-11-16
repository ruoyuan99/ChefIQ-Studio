-- 使用现有用户的数据库 Schema 测试
-- 如果您的数据库中已有用户，使用此脚本

-- ============================================
-- 方法 1: 使用第一个现有用户（推荐）
-- ============================================
-- 先查看现有用户
SELECT id, email, name FROM users LIMIT 5;

-- 然后使用第一个用户的 ID 替换下面的 'YOUR_USER_ID_HERE'
-- 或者直接运行下面的查询，它会自动使用第一个用户

-- ============================================
-- 方法 2: 自动使用第一个现有用户
-- ============================================
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- 获取第一个用户 ID
  SELECT id INTO existing_user_id FROM users LIMIT 1;
  
  IF existing_user_id IS NULL THEN
    -- 如果没有用户，创建一个测试用户
    INSERT INTO users (id, email, name)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'test@test.com',
      'Test User'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO existing_user_id;
    
    IF existing_user_id IS NULL THEN
      SELECT id INTO existing_user_id FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
    END IF;
  END IF;
  
  RAISE NOTICE '使用用户 ID: %', existing_user_id;
  
  -- 测试 1: 检查列类型
  RAISE NOTICE '=== 测试 1: 检查列类型 ===';
  
  -- 测试 2: 插入整数类型数据
  RAISE NOTICE '=== 测试 2: 插入整数类型数据 ===';
  INSERT INTO recipes (
    title,
    description,
    cooking_time,
    servings,
    cookware,
    is_public,
    user_id
  ) VALUES (
    'TEST_Schema_' || EXTRACT(EPOCH FROM NOW()),
    '测试 Schema 更改',
    25,
    4,
    'Regular Pan/Pot',
    false,
    existing_user_id
  );
  
  RAISE NOTICE '✅ 插入成功！';
END $$;

-- ============================================
-- 测试 1: 检查列类型
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name IN ('cooking_time', 'servings')
ORDER BY column_name;

-- ============================================
-- 测试 2: 查看刚插入的测试数据
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
WHERE title LIKE 'TEST_Schema_%'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 清理测试数据（可选）
-- ============================================
-- DELETE FROM recipes WHERE title LIKE 'TEST_Schema_%';

