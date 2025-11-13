# 清理积分活动 - 故障排除指南

## 问题：清理后仍然显示多次 check-in

### 可能的原因

1. **数据库权限问题**：DELETE 权限未正确设置
2. **RLS 策略问题**：Row Level Security 阻止删除操作
3. **缓存问题**：AsyncStorage 或 React 状态未正确更新
4. **网络问题**：删除请求失败但没有显示错误

## 解决步骤

### 步骤 1: 检查数据库权限

在 Supabase SQL Editor 中执行以下脚本：

```sql
-- 文件: database/check_and_fix_user_points_permissions.sql

-- 检查当前策略
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_points';

-- 如果 DELETE 策略不存在，创建它
CREATE POLICY "Users can delete own points" ON user_points
  FOR DELETE USING (auth.uid() = user_id);
```

### 步骤 2: 手动清理数据库（临时解决方案）

如果应用内清理失败，可以在 Supabase SQL Editor 中手动执行：

```sql
-- 替换 'YOUR_USER_ID' 为实际用户 ID
-- 可以通过以下查询获取用户 ID：
-- SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- 删除所有积分活动
DELETE FROM user_points 
WHERE user_id = 'YOUR_USER_ID';

-- 重置总积分
UPDATE users 
SET total_points = 0, updated_at = NOW()
WHERE id = 'YOUR_USER_ID';

-- 验证删除结果
SELECT COUNT(*) FROM user_points WHERE user_id = 'YOUR_USER_ID';
-- 应该返回 0
```

### 步骤 3: 检查应用日志

在 React Native Debugger 或控制台中查看以下日志：

1. `🧹 Starting to clear all points activities...`
2. `User ID: ...`
3. `Clear result: ...`
4. `✅ Cleared X points activities from Supabase`
5. `❌ Error deleting user_points from Supabase: ...`

### 步骤 4: 验证清理结果

清理后，检查以下内容：

1. **数据库**：
   ```sql
   SELECT COUNT(*) FROM user_points WHERE user_id = 'YOUR_USER_ID';
   ```

2. **AsyncStorage**：
   - 在 React Native Debugger 中检查 `userPoints` 键是否存在
   - 应该已经被删除

3. **应用状态**：
   - 刷新 Points History 页面
   - 应该显示为空或只有新的活动

### 步骤 5: 强制刷新

如果清理成功但页面仍显示旧数据：

1. 退出应用
2. 重新打开应用
3. 登录后查看 Points History

## 常见错误

### 错误 1: "new row violates row-level security policy"

**原因**：RLS 策略未正确设置

**解决**：执行 `database/check_and_fix_user_points_permissions.sql` 脚本

### 错误 2: "permission denied for table user_points"

**原因**：用户没有 DELETE 权限

**解决**：确保 RLS 策略中的 DELETE 策略已创建

### 错误 3: 清理成功但数据仍在

**原因**：可能是缓存问题或数据同步延迟

**解决**：
1. 等待几秒钟
2. 刷新页面
3. 重新登录应用

## 调试工具

### 1. 检查当前用户 ID

```typescript
import { useAuth } from '../contexts/AuthContext';

const { user } = useAuth();
console.log('Current user ID:', user?.id);
```

### 2. 检查数据库中的记录

```sql
-- 查看所有积分活动
SELECT 
  id,
  activity_type,
  description,
  points,
  created_at
FROM user_points
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### 3. 检查 AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const userPoints = await AsyncStorage.getItem('userPoints');
console.log('AsyncStorage userPoints:', userPoints);
```

## 临时解决方案

如果应用内清理仍然失败，可以使用以下 SQL 脚本手动清理：

```sql
-- 文件: database/clear_all_points_manual.sql

-- 替换 'YOUR_USER_ID' 为实际用户 ID
DELETE FROM user_points WHERE user_id = 'YOUR_USER_ID';
UPDATE users SET total_points = 0 WHERE id = 'YOUR_USER_ID';
```

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 错误日志（从控制台复制）
2. 用户 ID
3. 数据库中的记录数量（执行 `SELECT COUNT(*) FROM user_points WHERE user_id = 'YOUR_USER_ID'`）
4. 是否已执行权限脚本

