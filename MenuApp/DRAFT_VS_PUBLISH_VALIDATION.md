# 草稿 vs 发布验证规则

## 概述

系统现在支持两种保存模式：
1. **草稿（Draft）**: 允许部分字段为空，用户可以后续补充
2. **发布（Publish）**: 需要所有必需字段完整

---

## 验证规则

### 草稿验证（Save as Draft）

**必需字段**:
- ✅ `title` - 食谱标题

**可选字段**（可以为空）:
- ⚠️ `imageUri` - 主图片
- ⚠️ `cookingTime` - 烹饪时间
- ⚠️ `servings` - 份量
- ⚠️ `ingredients` - 食材列表
- ⚠️ `instructions` - 制作步骤
- ⚠️ `cookware` - 厨具类型
- ⚠️ `tags` - 标签
- ⚠️ `description` - 描述

**行为**:
- 用户导入不完整的食谱时，可以保存为草稿
- 提示用户："Recipe saved as draft. You can complete missing fields later."
- 用户可以在后续编辑时补充缺失字段

---

### 发布验证（Publish）

**必需字段**:
- ✅ `title` - 食谱标题
- ✅ `imageUri` - 主图片
- ✅ `cookingTime` - 烹饪时间
- ✅ `servings` - 份量
- ✅ `ingredients` - 至少一个食材
- ✅ `instructions` - 至少一个步骤

**行为**:
- 如果缺少任何必需字段，显示友好的错误提示
- 列出所有缺失的字段
- 提供"Save as Draft Instead"选项，方便用户快速保存草稿
- 错误提示示例：
  ```
  Cannot Publish Recipe
  
  Please complete the following required fields before publishing:
  
  Recipe Photo, Cooking Time, Servings
  
  You can save as draft and complete later.
  
  [Save as Draft Instead]  [OK]
  ```

---

## 代码实现

### 前端验证 (`CreateRecipeScreen.tsx`)

```typescript
const validateRecipe = (isPublish: boolean = false) => {
  // 1. 标题总是必需的
  if (!title) return false;
  
  // 2. 草稿模式：只需要标题
  if (!isPublish) return true;
  
  // 3. 发布模式：检查所有必需字段
  const missingFields = [];
  if (!imageUri) missingFields.push('Recipe Photo');
  if (!cookingTime) missingFields.push('Cooking Time');
  // ... 其他字段
  
  if (missingFields.length > 0) {
    // 显示错误并提供"保存为草稿"选项
    Alert.alert(..., [
      { text: 'Save as Draft Instead', onPress: () => handleSaveAsDraft() },
      { text: 'OK', style: 'cancel' }
    ]);
    return false;
  }
  
  return true;
};
```

### 后端处理 (`server.js`)

```javascript
// 后端允许部分字段为空
// 只验证标题，其他字段缺失时只警告，不阻止保存

if (!recipe.title) {
  throw new Error('Recipe title is required');
}

// 其他字段缺失时只警告
if (recipe.ingredients.length === 0) {
  console.warn('⚠️  Recipe has no ingredients - can be saved as draft');
}
```

---

## 用户体验流程

### 场景 1: 导入不完整食谱

1. 用户导入食谱，某些字段缺失（如缺少 cookingTime, servings）
2. 用户点击"Save as Draft"
3. ✅ 成功保存为草稿
4. 提示："Recipe saved as draft. You can complete missing fields later."
5. 用户可以后续编辑，补充缺失字段

### 场景 2: 尝试发布不完整食谱

1. 用户导入或创建食谱，某些字段缺失
2. 用户点击"Publish"
3. ❌ 验证失败
4. 显示错误提示，列出缺失字段
5. 用户可以选择：
   - "Save as Draft Instead" - 保存为草稿
   - "OK" - 返回编辑，补充缺失字段

### 场景 3: 草稿补充后发布

1. 用户打开草稿食谱
2. 补充缺失字段（cookingTime, servings 等）
3. 用户点击"Publish"
4. ✅ 验证通过，成功发布

---

## 优势

1. **灵活性**: 允许用户快速保存不完整的食谱
2. **用户体验**: 导入时即使数据不完整也能保存
3. **数据质量**: 发布时确保数据完整
4. **引导性**: 清晰的错误提示和"保存为草稿"选项

---

## 技术细节

### 后端 JSON Schema

```javascript
// 只要求核心字段
required: ["title", "description", "ingredients", "instructions"]

// 可选字段不在 required 中
cookingTime: { type: "string" }  // 可选
servings: { type: "string" }     // 可选
cookware: { type: ["string", "null"] }  // 可选
```

### 前端验证逻辑

```typescript
// 草稿：只需要标题
if (!isPublish) {
  return title ? true : false;
}

// 发布：需要所有字段
const checks = [
  title, imageUri, cookingTime, servings,
  ingredients.length > 0, instructions.length > 0
];
```

---

## 测试场景

### ✅ 测试 1: 导入不完整食谱并保存草稿
- 导入缺少 cookingTime 的食谱
- 点击"Save as Draft"
- 应该成功保存

### ✅ 测试 2: 尝试发布不完整食谱
- 导入缺少 cookingTime 的食谱
- 点击"Publish"
- 应该显示错误，并提供"Save as Draft"选项

### ✅ 测试 3: 草稿补充后发布
- 打开草稿食谱
- 补充 cookingTime
- 点击"Publish"
- 应该成功发布

