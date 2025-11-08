# Bug Fix: 更新食谱时同步子表数据

## 问题描述

**症状**: 
- 导入食谱后保存，ingredients 和 instructions 会丢失
- 即使保存逻辑正确，数据在数据库中也没有保存

**根本原因**:
在 `RealTimeSyncService.syncRecipe` 中：
- **创建新食谱时**：会同步 ingredients、instructions、tags 到子表 ✅
- **更新现有食谱时**：只更新 recipes 表，**不同步子表** ❌

这导致：
1. 如果食谱标题重复，会触发更新逻辑
2. 更新时只更新 recipes 表，ingredients 和 instructions 不会更新
3. 从数据库读取时，子表数据仍然是旧的或空的

---

## 修复方案

### 1. 修复更新逻辑 (`syncRecipe`)

**之前**:
```typescript
if (existingRecipe) {
  // 更新现有菜谱
  const { error: updateError } = await supabase
    .from('recipes')
    .update({ ... })
    .eq('id', existingRecipe.id);
  if (updateError) throw updateError;
  // ❌ 没有同步子表！
} else {
  // 创建新菜谱
  // ✅ 会同步子表
}
```

**修复后**:
```typescript
if (existingRecipe) {
  // 更新现有菜谱
  const { error: updateError } = await supabase
    .from('recipes')
    .update({ ... })
    .eq('id', existingRecipe.id);
  if (updateError) throw updateError;
  
  // ✅ 同步食材（更新时也要同步）
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    await this.syncIngredients(existingRecipe.id, recipe.ingredients);
  }

  // ✅ 同步步骤（更新时也要同步）
  if (recipe.instructions && recipe.instructions.length > 0) {
    await this.syncInstructions(existingRecipe.id, recipe.instructions);
  }

  // ✅ 同步标签（更新时也要同步）
  if (recipe.tags && recipe.tags.length > 0) {
    await this.syncTags(existingRecipe.id, recipe.tags);
  }
} else {
  // 创建新菜谱
  // ✅ 会同步子表（原有逻辑）
}
```

---

### 2. 增强子表同步函数的错误处理

#### `syncIngredients`

**之前**:
```typescript
private static async syncIngredients(recipeId: string, ingredients: any[]): Promise<void> {
  try {
    await supabase.from('ingredients').delete().eq('recipe_id', recipeId);
    const ingredientsData = ingredients.map(...);
    await supabase.from('ingredients').insert(ingredientsData);
  } catch (error) {
    console.error('❌ 食材同步失败:', error);
    // ❌ 错误被吞掉了，调用者不知道同步失败
  }
}
```

**修复后**:
```typescript
private static async syncIngredients(recipeId: string, ingredients: any[]): Promise<void> {
  try {
    console.log(`🔄 同步食材 - recipeId: ${recipeId}, count: ${ingredients.length}`);
    
    // 删除现有食材
    const { error: deleteError } = await supabase
      .from('ingredients')
      .delete()
      .eq('recipe_id', recipeId);
    
    if (deleteError) {
      console.error('❌ 删除现有食材失败:', deleteError);
      throw deleteError;
    }

    // 插入新食材
    const ingredientsData = ingredients.map((ingredient, index) => ({
      recipe_id: recipeId,
      name: ingredient.name || ingredient.ingredient || '',
      amount: typeof ingredient.amount === 'number' ? ingredient.amount : parseFloat(ingredient.amount || '1'),
      unit: ingredient.unit || '',
      order_index: index
    }));

    console.log('📝 准备插入食材数据:', ingredientsData);

    const { error: insertError, data } = await supabase
      .from('ingredients')
      .insert(ingredientsData)
      .select();
    
    if (insertError) {
      console.error('❌ 插入食材失败:', insertError);
      throw insertError;
    }
    
    console.log(`✅ 食材同步成功 - 插入了 ${data?.length || 0} 条记录`);
  } catch (error) {
    console.error('❌ 食材同步失败:', error);
    throw error; // ✅ 重新抛出错误，让调用者知道同步失败
  }
}
```

#### `syncInstructions`

类似修复，增强错误处理和日志。

---

### 3. 添加调试日志

在 `syncRecipe` 开始时添加日志：

```typescript
// 调试信息：检查 ingredients 和 instructions
console.log('📦 syncRecipe - Recipe data:', {
  title: recipe.title,
  ingredientsCount: recipe.ingredients?.length || 0,
  instructionsCount: recipe.instructions?.length || 0,
  ingredients: recipe.ingredients,
  instructions: recipe.instructions,
});
```

---

## 数据流

### 保存流程（修复后）

1. **用户点击保存** → `saveRecipeDataWithVisibility`
2. **构建 recipeDataToSave** → 包含 ingredients 和 instructions
3. **调用 addRecipe** → 传递完整的 recipeDataToSave
4. **RecipeContext.addRecipe** → 创建 Recipe 对象
5. **RealTimeSyncService.syncRecipe** → 同步到 Supabase:
   - 检查食谱是否存在
   - **如果存在** → 更新 recipes 表 ✅ **并同步子表** ✅
   - **如果不存在** → 插入 recipes 表 ✅ **并同步子表** ✅
6. **同步子表**:
   - `syncIngredients` → 删除旧数据，插入新数据
   - `syncInstructions` → 删除旧数据，插入新数据
   - `syncTags` → 删除旧数据，插入新数据

---

## 测试验证

### 测试步骤

1. **导入食谱**:
   - 打开应用
   - 点击 "Import from Website"
   - 输入 URL: `https://www.recipetineats.com/chicken-chasseur/`
   - 点击 "Import"

2. **保存食谱**:
   - 点击 "Save as Draft" 或 "Publish"
   - 查看控制台日志

3. **验证日志**:
   - `📦 syncRecipe - Recipe data:` - 应该显示 ingredients 和 instructions 数量
   - `🔄 同步食材 - recipeId: xxx, count: N` - 应该显示食材数量
   - `🔄 同步步骤 - recipeId: xxx, count: N` - 应该显示步骤数量
   - `✅ 食材同步成功 - 插入了 N 条记录` - 应该显示插入成功
   - `✅ 步骤同步成功 - 插入了 N 条记录` - 应该显示插入成功

4. **验证保存**:
   - 导航到 "My Recipes" 页面
   - 点击保存的食谱
   - 检查 ingredients 和 instructions 是否仍然存在

### 预期结果

✅ **修复前**: 
- 更新现有食谱时，ingredients 和 instructions 不会同步
- 从数据库读取时，子表数据为空

✅ **修复后**: 
- 无论创建还是更新，都会同步子表数据
- 从数据库读取时，子表数据完整

---

## 相关文件

- `MenuApp/src/services/realTimeSyncService.ts` - 主要修复
- `MenuApp/src/contexts/RecipeContext.tsx` - 错误处理改进

---

## 状态

✅ **已修复**

现在无论创建还是更新食谱，都会正确同步 ingredients 和 instructions 到数据库。

