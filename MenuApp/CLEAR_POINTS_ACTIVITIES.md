# 清理所有积分活动功能

## 功能说明

此功能允许用户清除所有积分活动记录，包括：
1. AsyncStorage 中的 `userPoints`
2. Supabase `user_points` 表中的所有记录
3. 重置 `users` 表中的 `total_points` 为 0

## 使用方法

### 方法 1: 通过 UI 界面（推荐）

1. 打开应用，导航到 "Points History" 页面
2. 点击右上角的垃圾桶图标（🗑️）
3. 确认清理操作
4. 清理完成后，页面会自动刷新

### 方法 2: 通过代码调用

```typescript
import { usePoints } from '../contexts/PointsContext';

const { clearAllPointsActivities } = usePoints();

// 清理所有积分活动
const result = await clearAllPointsActivities();
if (result.success) {
  console.log(`✅ 清理成功，删除了 ${result.deletedCount} 条记录`);
} else {
  console.error('❌ 清理失败:', result.message);
}
```

### 方法 3: 直接调用工具函数

```typescript
import { clearAllPointsActivities } from '../utils/clearAllPointsActivities';
import { supabase } from '../config/supabase';

// 获取当前用户ID
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;

// 清理所有积分活动
const result = await clearAllPointsActivities(userId);
```

## 数据库设置

### 1. 执行 SQL 脚本

在 Supabase SQL Editor 中执行以下脚本，添加 DELETE 和 UPDATE 权限：

```sql
-- 文件: database/add_user_points_delete_policy.sql

-- Allow users to delete their own points
CREATE POLICY "Users can delete own points" ON user_points
  FOR DELETE USING (auth.uid() = user_id);

-- Allow users to update their own points (optional, for future use)
CREATE POLICY "Users can update own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id);
```

### 2. 验证 RLS 策略

确保 `user_points` 表有以下 RLS 策略：

- ✅ SELECT: 用户可以查看自己的积分记录
- ✅ INSERT: 用户可以插入自己的积分记录
- ✅ DELETE: 用户可以删除自己的积分记录（需要添加）
- ✅ UPDATE: 用户可以更新自己的积分记录（可选）

## 注意事项

1. **不可逆操作**: 清理操作是不可逆的，所有积分活动记录将被永久删除
2. **权限要求**: 确保数据库 RLS 策略已正确配置，允许用户删除自己的记录
3. **用户登录**: 清理操作需要用户已登录，否则只能清除 AsyncStorage
4. **数据同步**: 清理后，本地状态和数据库会自动同步

## 文件结构

```
MenuApp/
├── src/
│   ├── contexts/
│   │   └── PointsContext.tsx          # 积分上下文，包含 clearAllPointsActivities 方法
│   ├── screens/
│   │   └── PointsHistoryScreen.tsx    # 积分历史页面，包含清理按钮
│   └── utils/
│       ├── clearAllPointsActivities.ts # 清理工具函数
│       └── runClearAllPoints.ts       # 可执行脚本（开发环境）
└── database/
    └── add_user_points_delete_policy.sql # 数据库权限脚本
```

## 测试

### 1. 测试清理功能

```typescript
// 在开发环境中，可以在 React Native Debugger 中执行
import { runClearAllPoints } from './src/utils/runClearAllPoints';

runClearAllPoints();
```

### 2. 验证清理结果

1. 检查 AsyncStorage: `userPoints` 键应该被删除
2. 检查数据库: `user_points` 表中应该没有该用户的记录
3. 检查 `users` 表: `total_points` 应该为 0
4. 检查 UI: 积分历史页面应该显示为空

## 故障排除

### 问题 1: 删除失败，提示权限错误

**解决方案**: 执行 `database/add_user_points_delete_policy.sql` 脚本，添加 DELETE 权限

### 问题 2: 清理后数据仍然存在

**可能原因**:
- 数据库 RLS 策略未正确配置
- 用户 ID 不匹配
- 网络请求失败

**解决方案**:
1. 检查数据库 RLS 策略
2. 检查用户登录状态
3. 查看控制台日志，确认错误信息

### 问题 3: 清理后页面未刷新

**解决方案**: 清理操作会自动更新本地状态，页面应该自动刷新。如果未刷新，可以手动导航回上一页再进入

## 相关文件

- `MenuApp/src/contexts/PointsContext.tsx` - 积分上下文
- `MenuApp/src/utils/clearAllPointsActivities.ts` - 清理工具函数
- `MenuApp/src/screens/PointsHistoryScreen.tsx` - 积分历史页面
- `MenuApp/database/add_user_points_delete_policy.sql` - 数据库权限脚本

