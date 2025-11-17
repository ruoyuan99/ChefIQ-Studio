# 统一食谱来源实现总结

## 实现目标
统一示例食谱的来源，确保示例食谱只从硬编码的 `sampleRecipes` 数组获取，不从数据库获取，避免重复显示和ID冲突问题。

## 实现的更改

### 1. `cloudRecipeService.ts` - 过滤示例食谱

**更改内容**：
- 添加了 `ADMIN_USER_ID` 常量（`00000000-0000-0000-0000-000000000001`）
- 创建了 `sampleRecipeTitles` Set，用于快速查找示例食谱标题
- 在 `fetchPublicRecipes()` 中，在映射之前过滤掉示例食谱
- 通过标题匹配和用户ID双重检查来识别示例食谱

**关键代码**：
```typescript
// 在映射之前过滤示例食谱
const nonSampleData = (data || []).filter((row: any) => {
  // 检查标题（主要检查）
  if (row.title && sampleRecipeTitles.has(row.title.toLowerCase().trim())) {
    return false; // 这是示例食谱，过滤掉
  }
  
  // 检查用户ID（如果是管理员用户且标题匹配，则是示例食谱）
  if (row.user_id === ADMIN_USER_ID && row.title) {
    if (sampleRecipeTitles.has(row.title.toLowerCase().trim())) {
      return false; // 这是示例食谱，过滤掉
    }
  }
  
  return true; // 保留这个食谱
});
```

**效果**：
- 从数据库获取的公开食谱不再包含示例食谱
- 确保示例食谱的唯一来源是硬编码的 `sampleRecipes` 数组

### 2. `ExploreScreen.tsx` - 简化去重逻辑

**更改内容**：
- 简化了 `allPublicRecipes` 的合并逻辑
- 移除了复杂的多层去重（因为云端已过滤示例食谱）
- 保留了基本的ID去重，确保用户保存的示例食谱不会重复显示

**关键代码**：
```typescript
const allPublicRecipes = useMemo(() => {
  // 本地公开食谱（用户创建的）
  const localPublicRecipes = state.recipes.filter(recipe => recipe.isPublic);
  const localRecipeIds = new Set(localPublicRecipes.map(r => r.id));
  
  // 云端公开食谱（已过滤掉示例食谱，只包含用户创建的公开食谱）
  const uniqueCloudRecipes = cloudPublicRecipes.filter(
    cloudRecipe => !localRecipeIds.has(cloudRecipe.id)
  );
  
  // 示例食谱（只从硬编码的 sampleRecipes 数组获取）
  const uniqueSampleRecipes = sampleRecipes.filter(
    sampleRecipe => !allExistingIds.has(sampleRecipe.id)
  );
  
  return [
    ...localPublicRecipes,
    ...uniqueCloudRecipes,
    ...uniqueSampleRecipes,
  ];
}, [state.recipes, cloudPublicRecipes]);
```

**效果**：
- 代码更简洁，易于维护
- 去重逻辑更清晰
- 性能更好（减少了不必要的去重操作）

### 3. `RecipeContext.tsx` - 确保新UUID生成

**更改内容**：
- 在 `addRecipe()` 函数中添加了安全检查
- 确保生成的UUID不会以 `sample_` 开头

**关键代码**：
```typescript
let recipeId = generateUUID();

// 安全检查：如果生成的ID以 sample_ 开头，重新生成
if (recipeId.startsWith('sample_')) {
  console.warn('⚠️ Generated ID starts with "sample_", regenerating...');
  recipeId = generateUUID();
}
```

**效果**：
- 确保用户保存的食谱永远不会使用示例食谱的ID格式
- 避免ID冲突

## 数据流

### 之前（有重复问题）：
```
数据库 (示例食谱，UUID ID)
  ↓
cloudPublicRecipes
  ↓
ExploreScreen (合并)
  ↓
显示重复的示例食谱 ❌
```

### 现在（统一来源）：
```
数据库 (示例食谱，UUID ID)
  ↓
cloudPublicRecipes (已过滤示例食谱) ✅
  ↓
ExploreScreen (合并)
  ↓
sampleRecipes (硬编码，sample_1 ID) ✅
  ↓
显示唯一的示例食谱 ✅
```

## 优势

1. **单一数据源**：示例食谱只从 `sampleRecipes` 数组获取，避免重复
2. **清晰的逻辑**：去重逻辑更简单，易于理解和维护
3. **性能优化**：减少了不必要的去重操作
4. **ID安全**：确保用户保存的食谱使用正确的UUID格式
5. **向后兼容**：不影响现有功能，只是改进了数据来源

## 注意事项

1. **数据库清理**（可选）：
   - 如果需要，可以运行SQL脚本删除数据库中的示例食谱
   - 或者保留它们，因为它们会被自动过滤掉

2. **Seed脚本**（可选）：
   - `scripts/seed-sample-recipes.ts` 可以继续运行，但插入的示例食谱会被自动过滤
   - 或者可以注释掉这个脚本，因为示例食谱现在只从代码中获取

3. **未来扩展**：
   - 如果添加新的示例食谱，只需更新 `sampleRecipes` 数组
   - 不需要运行seed脚本

## 测试建议

1. 检查 Explore 页面是否只显示一次示例食谱
2. 检查点击示例食谱是否能正常打开详情页
3. 检查用户保存示例食谱后是否生成新的UUID
4. 检查数据库中的示例食谱是否被正确过滤

## 相关文件

- `src/services/cloudRecipeService.ts` - 过滤逻辑
- `src/screens/ExploreScreen.tsx` - 合并逻辑
- `src/contexts/RecipeContext.tsx` - UUID生成
- `src/data/sampleRecipes.ts` - 示例食谱数据源

