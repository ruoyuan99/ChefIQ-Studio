# Recipe Import Flow 流程图

## 完整流程概览

```
用户输入URL
    ↓
前端 ImportRecipeModal
    ↓
调用 recipeImportService.importRecipeViaBackend()
    ↓
发送 POST 请求到后端 /api/import-recipe
    ↓
后端服务器处理
    ├─→ 1. 获取网页HTML (axios)
    ├─→ 2. Schema.org 提取 (extractRecipeFromHTML)
    ├─→ 3. AI提取 (如果Schema.org失败)
    └─→ 4. AI优化 (如果配置了OpenAI)
    ↓
返回结构化数据
    ↓
前端转换数据格式
    ↓
填充到 CreateRecipeScreen
    ↓
用户编辑/保存
```

---

## 详细流程

### 阶段 1: 用户触发导入

**位置**: `HomeScreen.tsx` 或 `CreateRecipeScreen.tsx`

1. 用户点击 "Import from Website"
2. 打开 `ImportRecipeModal`
3. 用户输入URL并点击 Import

**代码位置**:
- `MenuApp/src/screens/HomeScreen.tsx` (line 82-86)
- `MenuApp/src/components/ImportRecipeModal.tsx` (line 40-91)

---

### 阶段 2: 前端服务调用

**位置**: `MenuApp/src/services/recipeImportService.ts`

#### 2.1 调用后端API

```typescript
importRecipeViaBackend(url)
  ↓
POST http://192.168.10.153:3001/api/import-recipe
Body: { url: "https://..." }
```

**代码位置**: `recipeImportService.ts` (line 81-134)

#### 2.2 错误处理

- 如果后端失败，尝试直接解析（`importRecipeFromURL`）
- 显示网络错误提示

---

### 阶段 3: 后端服务器处理

**位置**: `MenuApp/server/server.js`

#### 3.1 接收请求

```javascript
app.post('/api/import-recipe', async (req, res) => {
  const { url } = req.body;
  // 验证URL格式
  // 获取HTML内容
})
```

**代码位置**: `server.js` (line 541-569)

#### 3.2 获取网页内容

```javascript
const response = await axios.get(url, {
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0...',
    // ... 其他headers
  }
});
```

**代码位置**: `server.js` (line 574-585)

#### 3.3 提取食谱数据 - 方法1: Schema.org

```javascript
extractRecipeFromHTML(html, url)
  ↓
查找 JSON-LD script 标签
  ↓
解析 Recipe 结构化数据
  ↓
提取:
  - title
  - description
  - ingredients (name, amount, unit)
  - instructions (step, description)
  - cookingTime
  - servings
  - tags
```

**代码位置**: `server.js` (line 252-305)

**支持的格式**:
- JSON-LD (`application/ld+json`)
- Microdata (fallback)

#### 3.4 提取食谱数据 - 方法2: AI提取（如果Schema.org失败）

```javascript
if (!recipe || !recipe.title) {
  if (openai) {
    extractRecipeWithAI(html, url)
      ↓
    使用 OpenAI GPT-4o-mini
    分析网页内容
    提取结构化数据
  }
}
```

**代码位置**: `server.js` (line 418-536)

**AI提取流程**:
1. 清理HTML（移除script、style等）
2. 提取主要内容（限制8000字符）
3. 发送到OpenAI GPT-4o-mini
4. 解析JSON响应
5. 验证数据完整性

#### 3.5 AI优化（总是执行，如果配置了OpenAI）

```javascript
if (openai && recipe && recipe.title) {
  optimizeRecipeWithAI(recipe, url)
    ↓
    标准化:
    - 食材数量和单位
    - 步骤说明清晰度
    - 烹饪时间格式
    - 份量格式
    添加标签（如果缺失）
}
```

**代码位置**: `server.js` (line 311-412)

**优化内容**:
- ✅ 标准化单位（cup, tbsp, tsp, oz, lb, g, ml）
- ✅ 改进步骤说明（去除冗余，提高清晰度）
- ✅ 规范化时间格式（"30 minutes", "1 hour"）
- ✅ 规范化份量格式（"4 servings"）
- ✅ 添加相关标签（菜系、餐食类型等）

#### 3.6 返回响应

```json
{
  "success": true,
  "recipe": {
    "title": "...",
    "description": "...",
    "ingredients": [...],
    "instructions": [...],
    "cookingTime": "...",
    "servings": "...",
    "tags": [...]
  }
}
```

**代码位置**: `server.js` (line 627-633)

---

### 阶段 4: 前端数据转换

**位置**: `MenuApp/src/services/recipeImportService.ts`

#### 4.1 转换后端响应

```typescript
transformBackendResponse(data.recipe)
  ↓
转换格式以匹配前端需求:
  - 确保数组格式正确
  - 处理嵌套对象
  - 验证数据类型
```

**代码位置**: `recipeImportService.ts` (line 136-234)

#### 4.2 返回 ImportedRecipe 格式

```typescript
{
  title: string;
  description: string;
  imageUrl?: string;
  ingredients: Array<{name, amount, unit}>;
  instructions: Array<{step, description}>;
  cookingTime?: string;
  servings?: string;
  tags?: string[];
}
```

---

### 阶段 5: 填充到创建页面

**位置**: `MenuApp/src/screens/CreateRecipeScreen.tsx`

#### 5.1 接收导入数据

```typescript
// 从 HomeScreen 导航传入
navigation.navigate('CreateRecipe', { 
  importedRecipe: recipe 
});

// 或从 ImportRecipeModal 回调
handleImportRecipe(recipe)
```

#### 5.2 转换并填充表单

```typescript
useEffect(() => {
  if (importedRecipe) {
    // 更新 recipeData
    setRecipeData(prev => ({
      ...prev,
      title: importedRecipe.title,
      description: importedRecipe.description,
      // ...
    }));

    // 转换 ingredients
    const convertedIngredients = importedRecipe.ingredients.map(...);
    setIngredients(convertedIngredients);

    // 转换 instructions
    const convertedInstructions = importedRecipe.instructions.map(...);
    setInstructions(convertedInstructions);

    // 同步到 recipeData
    setRecipeData(prev => ({
      ...prev,
      ingredients: convertedIngredients,
      instructions: convertedInstructions,
    }));
  }
}, [importedRecipe]);
```

**代码位置**: `CreateRecipeScreen.tsx` (line 102-177)

#### 5.3 自动同步机制

```typescript
// 确保 ingredients 和 instructions 同步到 recipeData
useEffect(() => {
  setRecipeData(prev => ({
    ...prev,
    ingredients: ingredients,
    instructions: instructions,
  }));
}, [ingredients, instructions]);
```

**代码位置**: `CreateRecipeScreen.tsx` (line 179-187)

---

### 阶段 6: 用户编辑和保存

#### 6.1 用户编辑

- 用户可以修改导入的内容
- 添加/删除食材和步骤
- 调整其他信息

#### 6.2 保存食谱

```typescript
saveRecipeDataWithVisibility(isPublic)
  ↓
使用最新的 ingredients 和 instructions
  ↓
调用 addRecipe() 或 updateRecipe()
  ↓
同步到 Supabase
```

**代码位置**: `CreateRecipeScreen.tsx` (line 756-785)

---

## 数据流图

```
┌─────────────────┐
│  用户输入URL     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ImportRecipeModal│
│  - 输入URL       │
│  - 显示加载状态   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ recipeImportService│
│ importRecipeViaBackend()│
└────────┬────────┘
         │
         ▼ POST /api/import-recipe
┌─────────────────┐
│   后端服务器     │
│ 1. 获取HTML      │
│ 2. Schema.org提取│
│ 3. AI提取(失败时)│
│ 4. AI优化(总是)  │
└────────┬────────┘
         │
         ▼ JSON Response
┌─────────────────┐
│ transformBackend │
│ Response()       │
└────────┬────────┘
         │
         ▼ ImportedRecipe
┌─────────────────┐
│ CreateRecipeScreen│
│ - 转换数据格式   │
│ - 填充表单       │
│ - 同步到state    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   用户编辑保存   │
└─────────────────┘
```

---

## 关键文件

### 前端

1. **ImportRecipeModal** (`src/components/ImportRecipeModal.tsx`)
   - UI组件，用户输入URL
   - 调用导入服务
   - 显示结果

2. **recipeImportService** (`src/services/recipeImportService.ts`)
   - 调用后端API
   - 转换数据格式
   - 错误处理

3. **CreateRecipeScreen** (`src/screens/CreateRecipeScreen.tsx`)
   - 接收导入数据
   - 转换并填充表单
   - 处理保存

4. **recipeImport config** (`src/config/recipeImport.ts`)
   - 后端URL配置
   - API端点定义

### 后端

1. **server.js** (`server/server.js`)
   - `/api/import-recipe` endpoint
   - Schema.org提取
   - AI提取和优化
   - 错误处理

---

## 错误处理

### 网络错误

```typescript
// 前端显示详细错误信息
if (errorMessage.includes('Network request failed')) {
  // 显示网络连接指导
}
```

### 提取失败

```javascript
// 后端返回404
{
  error: "No recipe found...",
  success: false
}
```

### AI优化失败

```javascript
// 使用原始提取数据
catch (optError) {
  console.warn('AI optimization failed, using original');
  return recipe; // 返回原始数据
}
```

---

## 性能优化

1. **后端优先使用Schema.org**（免费，快速）
2. **AI仅在必要时使用**（Schema.org失败时）
3. **AI优化使用轻量模型**（gpt-4o-mini，成本低）
4. **内容长度限制**（8000字符，避免token超限）

---

## 成本估算

- **Schema.org提取**: 免费
- **AI提取**: ~$0.001-0.01 per recipe
- **AI优化**: ~$0.001-0.005 per recipe
- **总成本**: ~$0.001-0.015 per recipe

---

## 未来改进

1. ✅ 已实现：AI优化所有导入的食谱
2. 🔄 待实现：Scan from Image功能
3. 📝 建议：缓存已导入的URL
4. 📝 建议：支持批量导入
5. 📝 建议：预览导入结果

