# 快速测试数据库 Schema 更改

由于需要 Service Role Key，这里提供两种测试方法：

## 方法 1: 在 Supabase Dashboard 中运行 SQL（推荐，最简单）

这是最简单的方法，不需要设置任何环境变量。

### 步骤：

1. **打开 Supabase Dashboard**
   - 访问：https://app.supabase.com
   - 登录并选择您的项目

2. **打开 SQL Editor**
   - 在左侧菜单选择 "SQL Editor"
   - 点击 "New query"

3. **运行测试 SQL**
   - 复制 `database/test_schema.sql` 文件的内容
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

4. **查看结果**
   - 测试会自动执行并显示结果
   - 检查输出是否符合预期

### 预期输出：

```
column_name    | data_type | is_nullable
---------------|-----------|-------------
cooking_time   | integer   | YES
servings       | integer   | YES
```

所有测试应该显示：
- ✅ 列类型为 `integer`
- ✅ 可以插入整数类型数据
- ✅ 查询返回正确的数据类型

## 方法 2: 使用 TypeScript 测试脚本

如果您有 Service Role Key，可以使用自动测试脚本。

### 步骤：

1. **获取 Service Role Key**
   - 打开 Supabase Dashboard
   - 进入 Settings → API
   - 复制 "service_role" key（⚠️  注意：这是秘密密钥，不要泄露）

2. **设置环境变量**
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **运行测试**
   ```bash
   cd MenuApp
   ./scripts/quick-test-schema.sh
   ```
   或者：
   ```bash
   npx tsx scripts/test-db-schema.ts
   ```

## 最简单的测试（手动 SQL）

在 Supabase Dashboard 的 SQL Editor 中运行以下 SQL：

```sql
-- 1. 检查列类型（最关键的测试）
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name IN ('cooking_time', 'servings')
ORDER BY column_name;

-- 2. 插入测试数据
INSERT INTO recipes (
  title,
  description,
  cooking_time,  -- INTEGER
  servings,      -- INTEGER
  cookware,
  is_public,
  user_id
) VALUES (
  'TEST_' || EXTRACT(EPOCH FROM NOW()),
  '测试 Schema 更改',
  25,  -- INTEGER (minutes)
  4,   -- INTEGER
  'Regular Pan/Pot',
  false,
  '00000000-0000-0000-0000-000000000001'
) RETURNING id, cooking_time, servings;

-- 3. 验证类型
SELECT 
  id,
  title,
  cooking_time,
  servings,
  pg_typeof(cooking_time) AS cooking_time_type,
  pg_typeof(servings) AS servings_type
FROM recipes
WHERE title LIKE 'TEST_%'
ORDER BY created_at DESC
LIMIT 1;

-- 4. 清理测试数据（可选）
DELETE FROM recipes WHERE title LIKE 'TEST_%';
```

### 预期结果：

**测试 1 (检查列类型):**
```
cooking_time   | integer   | YES
servings       | integer   | YES
```

**测试 2 (插入):**
- 应该成功插入，返回的 `cooking_time` 和 `servings` 应该是数字（25 和 4）

**测试 3 (验证类型):**
- `cooking_time_type`: `integer`
- `servings_type`: `integer`

## 验证清单

完成测试后，确认：

- [ ] `cooking_time` 列类型为 `integer`
- [ ] `servings` 列类型为 `integer`
- [ ] 可以插入整数类型数据（如 `25`, `4`）
- [ ] 查询返回的数据类型为 `integer`
- [ ] 数据可以正常显示（前端会自动格式化为 `"25分钟"`）

## 如果测试失败

1. **列类型仍然是 TEXT**
   - 需要运行迁移脚本：`database/migrate_cooking_time_to_integer.sql`

2. **插入失败**
   - 检查 RLS 策略是否允许插入
   - 确保 user_id 存在

3. **类型转换错误**
   - 检查前端代码是否正确处理整数类型
   - 查看 `cloudRecipeService.ts` 中的转换逻辑

