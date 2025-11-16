# 数据库 Schema 更改测试指南

本文档说明如何测试 `cooking_time` 和 `servings` 字段从 TEXT 改为 INTEGER 的更改。

## 测试目标

- ✅ `cooking_time` 字段应为 INTEGER 类型（存储分钟数，范围 1-999）
- ✅ `servings` 字段应为 INTEGER 类型（存储人数，范围 1-20）

## 测试方法

### 方法 1: 使用 TypeScript 测试脚本（推荐）

1. **设置环境变量**

   创建 `.env` 文件（如果不存在）：
   ```bash
   cd MenuApp
   echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env
   ```

   或者直接在命令行设置：
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **运行测试脚本**

   ```bash
   cd MenuApp
   npx tsx scripts/test-db-schema.ts
   ```

   测试脚本将执行以下测试：
   - ✅ 插入整数类型的 cooking_time 和 servings
   - ✅ 验证数据类型
   - ✅ 查询并验证返回的数据类型
   - ✅ 检查现有数据的类型
   - ✅ 测试数据转换（整数 -> 显示格式）

### 方法 2: 使用 SQL 测试脚本

1. **在 Supabase Dashboard 中运行 SQL**

   打开 Supabase Dashboard → SQL Editor，然后运行：
   
   ```bash
   cd MenuApp/database
   cat test_schema.sql
   ```
   
   将输出复制到 Supabase SQL Editor 中执行。

   或者直接在 Supabase Dashboard 中打开 `database/test_schema.sql` 文件。

2. **SQL 测试脚本将执行：**

   - 检查列类型（information_schema）
   - 插入整数类型数据
   - 验证数据类型（pg_typeof）
   - 尝试插入字符串类型（验证转换或拒绝）
   - 检查约束（1-999 范围）

### 方法 3: 手动测试

#### 步骤 1: 检查表结构

在 Supabase SQL Editor 中运行：

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name IN ('cooking_time', 'servings')
ORDER BY column_name;
```

**预期结果：**
- `cooking_time`: `data_type` 应为 `integer`
- `servings`: `data_type` 应为 `integer`

#### 步骤 2: 插入测试数据

```sql
INSERT INTO recipes (
  title,
  description,
  cooking_time,
  servings,
  cookware,
  is_public,
  user_id
) VALUES (
  'TEST_Manual_' || EXTRACT(EPOCH FROM NOW()),
  '手动测试数据',
  25,  -- INTEGER (minutes)
  4,   -- INTEGER
  'Regular Pan/Pot',
  false,
  '00000000-0000-0000-0000-000000000001'
) RETURNING id, cooking_time, servings;
```

**预期结果：**
- 插入成功
- 返回的 `cooking_time` 应为 `25`（数字类型）
- 返回的 `servings` 应为 `4`（数字类型）

#### 步骤 3: 查询并验证类型

```sql
SELECT 
  id,
  title,
  cooking_time,
  servings,
  pg_typeof(cooking_time) AS cooking_time_type,
  pg_typeof(servings) AS servings_type
FROM recipes
WHERE title LIKE 'TEST_Manual_%'
ORDER BY created_at DESC
LIMIT 1;
```

**预期结果：**
- `cooking_time_type`: `integer`
- `servings_type`: `integer`

#### 步骤 4: 测试无效类型（应该失败）

```sql
-- 尝试插入字符串（PostgreSQL 可能会自动转换，但我们需要验证）
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
  '测试字符串类型',
  '30分钟',  -- STRING - 应该失败或自动转换
  '4',       -- STRING - 可能自动转换
  'Regular Pan/Pot',
  false,
  '00000000-0000-0000-0000-000000000001'
);
```

**预期结果：**
- 如果插入成功，检查返回的数据类型是否转换为 integer
- 如果插入失败，说明类型约束生效（这也是正确的）

#### 步骤 5: 清理测试数据

```sql
DELETE FROM recipes WHERE title LIKE 'TEST_%';
```

## 验证前端代码

确保前端代码正确处理数据类型转换：

1. **检查 `cloudRecipeService.ts`**
   
   ```typescript
   // 应该将数据库的 INTEGER 转换为显示字符串
   cookingTime: row.cooking_time ? `${row.cooking_time}分钟` : '',
   servings: row.servings ? String(row.servings) : '',
   ```

2. **检查服务文件中的转换函数**
   
   - `realTimeSyncService.ts`: 应该有 `toCookingTimeMinutes()` 函数
   - `autoSyncService.ts`: 应该有 `toCookingTimeMinutes()` 函数
   - `dataMigrationService.ts`: 应该有 `toCookingTimeMinutes()` 函数
   - `seed-sample-recipes.ts`: 应该有 `toCookingTime()` 函数

## 迁移现有数据

如果数据库中有现有的 TEXT 类型数据，需要运行迁移脚本：

```sql
-- 在 Supabase SQL Editor 中运行
\i MenuApp/database/migrate_cooking_time_to_integer.sql
```

或者在 Supabase Dashboard 中打开并执行 `database/migrate_cooking_time_to_integer.sql` 文件。

## 预期测试结果

所有测试应该显示：

- ✅ `cooking_time` 字段类型为 `integer`
- ✅ `servings` 字段类型为 `integer`
- ✅ 可以插入整数类型数据
- ✅ 查询返回的数据类型为 `integer`
- ✅ 前端代码正确转换显示格式（`"25分钟"`）

## 故障排除

### 错误: "column cooking_time is of type integer but expression is of type text"

**原因：** 代码尝试插入字符串类型到 INTEGER 字段。

**解决：** 确保所有插入代码使用转换函数（如 `toCookingTimeMinutes()`）。

### 错误: "value out of range"

**原因：** 插入的值超出范围（cooking_time < 1 或 > 999）。

**解决：** 确保值在有效范围内。

### 现有数据仍然是 TEXT 类型

**原因：** 迁移脚本未运行或失败。

**解决：** 
1. 检查迁移脚本是否成功执行
2. 手动更新现有数据：
   ```sql
   UPDATE recipes 
   SET cooking_time = CAST(cooking_time AS INTEGER)
   WHERE cooking_time ~ '^\s*\d+\s*$';
   ```

## 验证清单

- [ ] 数据库 Schema 已更新（cooking_time 为 INTEGER）
- [ ] 迁移脚本已运行（如果适用）
- [ ] TypeScript 测试脚本通过
- [ ] SQL 测试脚本通过
- [ ] 可以插入整数类型数据
- [ ] 前端代码正确显示数据（`"25分钟"`）
- [ ] 现有数据已迁移（如果适用）

