# 自动清除 AsyncStorage 功能说明

## 功能概述

当 AsyncStorage 中的数据成功上传到 Supabase 数据库后，系统会自动清除本地 AsyncStorage 中**所有同类的历史数据**（不只是当前上传的数据）。

## 实现位置

### 1. 积分数据（PointsContext）

**文件**: `MenuApp/src/contexts/PointsContext.tsx`

**触发时机**:
- 积分活动成功同步到 `user_points` 表后
- 验证数据库中已有数据后

**清除逻辑**:
```typescript
// 同步成功后，验证数据库中有数据
// 如果验证通过，清除所有 AsyncStorage 中的 userPoints（包括所有历史数据）
await AsyncStorage.removeItem('userPoints');
```

**验证机制**:
- 检查 `user_points` 表中是否有该用户的记录
- 只有确认数据库中有数据时才清除本地数据
- **清除所有同类的历史数据**（不只是当前同步的数据）
- 延迟 1 秒确保数据库已更新

### 2. 菜谱数据（RecipeContext）

**文件**: `MenuApp/src/contexts/RecipeContext.tsx`

**触发时机**:
- 自动同步成功完成后
- 单个菜谱实时同步成功后

**清除逻辑**:
```typescript
// 同步成功后，验证数据库中已有菜谱
// 如果验证通过，清除所有 AsyncStorage 中的 recipes（包括所有历史数据）
await AsyncStorage.removeItem('recipes');
```

**验证机制**:
- 检查 `recipes` 表中是否有该用户的记录
- 只有确认数据库中有数据时才清除本地数据
- **清除所有同类的历史数据**（不只是当前同步的数据）
- 延迟 1-2 秒确保数据库已更新

### 3. 批量同步（AutoSyncService）

**文件**: `MenuApp/src/services/autoSyncService.ts`

**触发时机**:
- 所有数据成功同步到数据库后
- 在 `syncAllDataToSupabase()` 方法中

**清除的数据**:
- `recipes` - 菜谱数据（**所有历史数据**）
- `favorites` - 收藏数据（**所有历史数据**）
- `userPoints` - 积分数据（**所有历史数据**）
- `comments` - 评论数据（**所有历史数据**）
- `socialStats` - 社交统计数据（**所有历史数据**）

**验证机制**:
- 检查每个表是否有该用户的记录
- 只有确认数据库中有数据时才清除对应的 AsyncStorage
- **清除所有同类的历史数据**（不只是当前同步的数据）
- 逐一验证和清除，确保数据安全

## 工作流程

### 积分数据同步流程

1. **添加积分活动** → 保存到 AsyncStorage
2. **用户登录** → 自动同步到 Supabase
3. **验证同步成功** → 检查数据库中有记录
4. **清除 AsyncStorage** → 删除 `userPoints`

### 菜谱数据同步流程

1. **创建/修改菜谱** → 保存到 AsyncStorage
2. **用户登录** → 自动同步到 Supabase
3. **验证同步成功** → 检查数据库中有记录
4. **清除 AsyncStorage** → 删除 `recipes`

### 批量同步流程

1. **用户登录** → 触发自动同步
2. **同步所有数据** → recipes, favorites, points, comments
3. **验证同步成功** → 检查每个表是否有记录
4. **清除 AsyncStorage** → 删除已同步的数据

## 安全机制

### 1. 验证后再清除

在清除 AsyncStorage 之前，系统会：
- 查询数据库确认数据已存在
- 检查数据数量是否正确
- 只有验证通过才清除本地数据

### 2. 延迟清除

在同步成功后，延迟 1-2 秒再清除：
- 确保数据库操作已完成
- 避免过早清除导致数据丢失
- 给数据库一些时间完成写入

### 3. 错误处理

即使清除失败，也不会影响同步结果：
- 清除失败不会导致同步失败
- 清除错误会被记录到控制台
- 数据仍然在数据库中，下次可以重新清除

### 4. 完整清除

清除所有同类的历史数据：
- 如果某个表同步成功，会清除该类型的所有 AsyncStorage 数据
- 不只是清除当前同步的数据，而是清除该 key 下的所有历史数据
- 每个数据项独立验证和清除
- 未同步成功的数据类型保留在本地

## 清除的数据项

### 积分系统
- `userPoints` - 积分活动历史

### 菜谱系统
- `recipes` - 菜谱列表
- `favorites` - 收藏列表（如果同步成功）

### 社交系统
- `comments` - 评论数据（如果同步成功）
- `socialStats` - 社交统计数据（如果同步成功）

### 不会清除的数据
- `user` - 用户信息（始终保留）
- 其他未同步的数据

## 日志输出

清除时会输出以下日志：

```
✅ Synced X activities to database
✅ Cleared all userPoints from AsyncStorage after successful sync
```

或者：

```
✅ Automatic sync completed!
✅ Cleared all recipes from AsyncStorage (including historical data)
✅ Cleared all favorites from AsyncStorage (including historical data)
✅ Cleared all userPoints from AsyncStorage (including historical data)
✅ Cleared all historical data for X items from AsyncStorage: recipes, favorites, userPoints
```

## 注意事项

1. **只在成功同步后清除**：如果同步失败，AsyncStorage 数据会保留
2. **验证机制**：清除前会验证数据库中有数据
3. **延迟清除**：同步成功后延迟 1-2 秒再清除
4. **不影响功能**：清除后，应用会从数据库加载数据
5. **离线保护**：如果用户未登录，数据不会清除

## 测试方法

1. **查看日志**：
   - 启动应用并登录
   - 查看控制台是否有 "Cleared ... from AsyncStorage" 的日志

2. **验证清除**：
   ```javascript
   // 在调试器中检查
   debugAllKeys()  // 应该看不到 userPoints 或 recipes（如果已清除）
   ```

3. **验证数据仍在数据库**：
   - 检查 Supabase 数据库
   - 确认数据仍然存在

4. **重新加载验证**：
   - 刷新应用
   - 数据应该从数据库重新加载

## 故障排除

### 问题 1: AsyncStorage 没有被清除

**可能原因**:
- 同步失败
- 数据库验证失败
- 用户未登录

**解决方法**:
- 检查控制台日志
- 确认同步是否成功
- 验证数据库中是否有数据

### 问题 2: 数据丢失

**可能原因**:
- 清除后数据库没有数据
- 清除时机过早

**解决方法**:
- 检查数据库是否真的有数据
- 增加延迟时间
- 检查验证逻辑

### 问题 3: 清除后无法加载

**可能原因**:
- 数据库连接失败
- 数据加载失败

**解决方法**:
- 检查网络连接
- 检查数据库配置
- 查看错误日志

## 配置选项

如果需要调整清除行为，可以修改：

1. **延迟时间**：
   - PointsContext: `setTimeout(..., 1000)` - 1 秒
   - RecipeContext: `setTimeout(..., 1000-2000)` - 1-2 秒
   - AutoSyncService: 立即验证（已在同步完成后）

2. **验证逻辑**：
   - 修改验证查询
   - 调整验证条件

3. **清除的数据项**：
   - 在 AutoSyncService 中添加或删除清除项

