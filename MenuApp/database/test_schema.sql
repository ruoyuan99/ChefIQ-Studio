-- 数据库 Schema 测试脚本
-- 此脚本用于测试 cooking_time 和 servings 字段的数据类型

-- 准备: 确保测试用户存在
INSERT INTO users (id, email, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@test.com',
  'Test User'
)
ON CONFLICT (id) DO NOTHING;

-- 测试 1: 检查表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name IN ('cooking_time', 'servings')
ORDER BY column_name;

-- 测试 2: 尝试插入正确的数据类型（应该成功）
DO $$
DECLARE
  test_recipe_id UUID;
BEGIN
  INSERT INTO recipes (
    title,
    description,
    cooking_time,
    servings,
    cookware,
    is_public,
    user_id
  ) VALUES (
    'TEST_Integer_' || EXTRACT(EPOCH FROM NOW()),
    '测试整数类型插入',
    25,  -- INTEGER (minutes)
    4,   -- INTEGER
    'Regular Pan/Pot',
    false,
    '00000000-0000-0000-0000-000000000001'
  ) RETURNING id INTO test_recipe_id;
  
  RAISE NOTICE '✅ 成功插入整数类型！Recipe ID: %', test_recipe_id;
END $$;

-- 测试 3: 检查插入的数据类型
SELECT 
  id,
  title,
  cooking_time,
  servings,
  pg_typeof(cooking_time) AS cooking_time_type,
  pg_typeof(servings) AS servings_type
FROM recipes
WHERE title LIKE 'TEST_Integer_%'
ORDER BY created_at DESC
LIMIT 1;

-- 测试 4: 尝试插入字符串类型（应该失败或自动转换）
-- 注意：PostgreSQL 会尝试自动转换，所以我们需要检查结果
DO $$
DECLARE
  test_recipe_id UUID;
  cooking_time_value INTEGER;
BEGIN
  -- 尝试插入字符串，PostgreSQL 可能会自动转换
  INSERT INTO recipes (
    title,
    description,
    cooking_time,
    servings,
    cookware,
    is_public,
    user_id
  ) VALUES (
    'TEST_String_' || EXTRACT(EPOCH FROM NOW()),
    '测试字符串类型插入',
    CAST('30' AS TEXT),  -- 尝试作为 TEXT 插入
    CAST('4' AS TEXT),   -- 尝试作为 TEXT 插入
    'Regular Pan/Pot',
    false,
    '00000000-0000-0000-0000-000000000001'
  ) RETURNING id, cooking_time INTO test_recipe_id, cooking_time_value;
  
  IF cooking_time_value IS NOT NULL THEN
    RAISE NOTICE '✅ 字符串自动转换为整数！Recipe ID: %, cooking_time: %', test_recipe_id, cooking_time_value;
  ELSE
    RAISE NOTICE '⚠️  字符串插入返回 NULL';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✅ 正确拒绝无效类型：%', SQLERRM;
END $$;

-- 测试 5: 检查所有测试数据
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
WHERE title LIKE 'TEST_%'
ORDER BY created_at DESC;

-- 测试 6: 验证约束（cooking_time 应该在 1-999 范围内）
DO $$
BEGIN
  -- 尝试插入超出范围的值（应该被约束阻止）
  BEGIN
    INSERT INTO recipes (
      title,
      description,
      cooking_time,
      servings,
      cookware,
      is_public,
      user_id
    ) VALUES (
      'TEST_Constraint_' || EXTRACT(EPOCH FROM NOW()),
      '测试约束',
      1000,  -- 超出范围（应该被约束阻止）
      4,
      'Regular Pan/Pot',
      false,
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE NOTICE '⚠️  约束未生效：允许插入超出范围的值';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ 约束生效：正确拒绝超出范围的值';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  其他错误：%', SQLERRM;
  END;
END $$;

-- 清理测试数据（可选）
-- DELETE FROM recipes WHERE title LIKE 'TEST_%';

