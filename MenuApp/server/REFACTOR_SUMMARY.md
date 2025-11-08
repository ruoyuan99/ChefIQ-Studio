# Recipe Import 重构总结

## 重构目标

✅ 后端优先 + JSON-LD 兜底策略  
✅ AI 使用 Structured Outputs 严格 JSON Schema  
✅ 按需触发 AI（只在 Schema.org 失败时）  
✅ 后端统一生成完整 Recipe schema（ID、时间戳、可见性、校验）  
✅ 前端简化，直接接收完整 schema

---

## 主要改进

### 1. 严格 JSON Schema 定义

**位置**: `server.js` (line 311-386)

```javascript
const RECIPE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", ... },
    description: { type: "string", ... },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "number" },  // 严格类型：数字
          unit: { type: "string" }
        },
        required: ["name", "amount", "unit"],
        additionalProperties: false  // 严格模式
      }
    },
    // ... 其他字段
  },
  required: ["title", "description", "ingredients", "instructions"],
  additionalProperties: false
};
```

**优势**:
- ✅ 严格类型验证
- ✅ 自动格式保证
- ✅ 减少解析错误

---

### 2. AI 使用 Structured Outputs

**位置**: `server.js` (line 509-535)

```javascript
const completion = await openai.beta.chat.completions.parse({
  model: 'gpt-4o-mini',
  messages: [...],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'recipe_extraction',
      strict: true,  // 严格模式
      schema: RECIPE_JSON_SCHEMA
    }
  }
});

// 自动验证和解析，无需手动 JSON.parse
const recipeData = completion.choices[0].message.parsed;
```

**优势**:
- ✅ 自动 JSON Schema 验证
- ✅ 类型安全保证
- ✅ 无需手动解析和验证
- ✅ 减少错误处理代码

---

### 3. 后端统一生成完整 Recipe Schema

**位置**: `server.js` (line 42-117)

```javascript
function generateCompleteRecipeSchema(rawRecipe) {
  const now = new Date();
  const recipeId = `recipe_${Date.now()}_${Math.random()...}`;

  return {
    // 必需字段
    id: recipeId,
    title: rawRecipe.title,
    description: rawRecipe.description,
    createdAt: now,
    updatedAt: now,
    isPublic: false,  // 默认私有

    // 内容字段（已格式化）
    ingredients: [...],  // 带 ID
    instructions: [...], // 带 ID
    tags: [...],
    
    // 可选字段
    items: [],
    cookingTime: '',
    servings: '',
    cookware: undefined,
    imageUri: null,
    // ...
  };
}
```

**优势**:
- ✅ 前端无需转换
- ✅ 统一的数据格式
- ✅ 自动生成 ID 和时间戳
- ✅ 默认值保证

---

### 4. 按需触发 AI

**位置**: `server.js` (line 518-542)

```javascript
// Step 1: Schema.org 提取（免费，快速）
let rawRecipe = extractRecipeFromHTML(html, url);

// Step 2: 只在 Schema.org 失败时使用 AI
if (!rawRecipe || !rawRecipe.title) {
  if (openai) {
    rawRecipe = await extractRecipeWithAI(html, url);
  }
}

// Step 3: 生成完整 schema
const finalRecipe = generateCompleteRecipeSchema(rawRecipe);
```

**优势**:
- ✅ 成本优化（AI 只在必要时使用）
- ✅ 性能优化（Schema.org 免费且快速）
- ✅ 更快的响应时间

---

### 5. 前端简化

**之前**:
```typescript
// 需要转换数据格式
const convertedIngredients = importedRecipe.ingredients.map(...);
const convertedInstructions = importedRecipe.instructions.map(...);
// 需要生成 ID
// 需要设置默认值
```

**现在**:
```typescript
// 直接使用后端返回的完整 schema
setIngredients(importedRecipe.ingredients || []);
setInstructions(importedRecipe.instructions || []);
```

**优势**:
- ✅ 代码更简洁
- ✅ 减少错误
- ✅ 更好的维护性

---

## 数据流对比

### 之前

```
Schema.org 提取
    ↓
AI 优化（总是执行）
    ↓
返回原始数据
    ↓
前端转换
    ↓
生成 ID/时间戳
    ↓
填充表单
```

### 现在

```
Schema.org 提取
    ↓ (失败时)
AI 提取（Structured Outputs）
    ↓
后端统一生成完整 schema
    ↓
直接返回 Recipe 对象
    ↓
前端直接使用
```

---

## 成本对比

### 之前
- Schema.org: 免费
- AI 优化: 总是执行 (~$0.001-0.005)
- **总成本**: ~$0.001-0.005 per recipe

### 现在
- Schema.org: 免费（优先）
- AI 提取: 只在失败时 (~$0.001-0.01)
- **总成本**: 
  - Schema.org 成功: $0
  - Schema.org 失败: ~$0.001-0.01

**节省**: 如果 80% 的网站支持 Schema.org，可节省 80% 的 AI 成本

---

## 稳定性改进

### 1. 严格类型验证
- JSON Schema 自动验证
- 类型错误自动捕获
- 减少运行时错误

### 2. 统一数据格式
- 后端统一生成
- 前端无需转换
- 减少格式不一致问题

### 3. 更好的错误处理
- Structured Outputs 自动验证
- 明确的错误信息
- 优雅降级

---

## 代码质量改进

### 1. 后端
- ✅ 单一职责：后端负责数据提取和格式化
- ✅ 类型安全：JSON Schema 保证
- ✅ 易于测试：清晰的函数边界

### 2. 前端
- ✅ 简化逻辑：无需转换
- ✅ 更少代码：减少 50+ 行转换代码
- ✅ 更易维护：直接使用后端数据

---

## 测试建议

1. **测试 Schema.org 提取**
   ```bash
   curl -X POST http://localhost:3001/api/import-recipe \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.recipetineats.com/chicken-chasseur/"}'
   ```

2. **测试 AI 提取（Schema.org 失败时）**
   ```bash
   curl -X POST http://localhost:3001/api/import-recipe \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example-recipe-blog.com/recipe"}'
   ```

3. **验证返回的 schema**
   - 检查是否包含所有必需字段
   - 验证 ID、时间戳格式
   - 确认 ingredients/instructions 有 ID

---

## 注意事项

1. **OpenAI SDK 版本**
   - 需要 4.20.0+ 支持 Structured Outputs
   - 当前版本: 4.104.0 ✅

2. **模型支持**
   - `gpt-4o-mini` 支持 Structured Outputs ✅
   - `gpt-4o` 支持 Structured Outputs ✅
   - `gpt-3.5-turbo` 不支持 ❌

3. **Schema 严格性**
   - `strict: true` 确保完全匹配 schema
   - `additionalProperties: false` 禁止额外字段

---

## 下一步

1. ✅ 重构完成
2. 🔄 测试验证
3. 📝 监控成本
4. 📊 收集数据质量反馈

