# 🔧 修复RLS策略错误 - 数据迁移

## ❌ 当前问题
```
ERROR 创建用户资料失败: {"code": "42501", "details": null, "hint": null, "message": "new row violates row-level security policy for table \"users\""}
```

这个错误是因为Supabase的RLS（行级安全）策略没有允许用户创建自己的用户记录。

## ✅ 解决方案

### 方法1：在Supabase Dashboard中修复（推荐）

1. **打开Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 登录您的账户
   - 选择您的项目

2. **进入SQL编辑器**
   - 点击左侧菜单的 "SQL Editor"
   - 点击 "New query"

3. **执行修复脚本**
   复制并粘贴以下SQL代码：

```sql
-- 修复RLS策略 - 允许用户创建自己的用户记录
-- 删除现有的用户策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 重新创建用户策略，包括INSERT权限
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

4. **执行脚本**
   - 点击 "Run" 按钮
   - 等待执行完成
   - 应该看到 "Success. No rows returned" 消息

5. **验证修复**
   执行以下查询验证策略是否正确：

```sql
-- 验证用户表的RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
```

### 方法2：使用命令行修复

如果您有Supabase CLI，可以执行：

```bash
# 在项目根目录执行
supabase db reset
```

然后重新执行数据库设置脚本。

## 🚀 修复后继续数据迁移

1. **确认RLS策略已修复**
2. **重新打开应用**：http://localhost:8083
3. **登录您的账户**
4. **进入 Profile → Data Migration**
5. **点击 "开始迁移"**

## 🔍 验证修复是否成功

在Supabase Dashboard中执行以下查询：

```sql
-- 检查用户表的策略
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
```

应该看到三个策略：
- Users can view own profile (SELECT)
- Users can create own profile (INSERT) ← 这个很重要
- Users can update own profile (UPDATE)

## 📞 如果仍有问题

1. **检查用户认证状态**
   - 确认用户已正确登录
   - 检查 `auth.uid()` 是否返回正确的用户ID

2. **检查表结构**
   - 确认 `users` 表存在
   - 确认 `id` 字段类型为 `uuid`

3. **重新创建策略**
   - 删除所有用户相关策略
   - 重新创建策略

---

**修复完成后，您就可以正常进行数据迁移了！** 🎉
