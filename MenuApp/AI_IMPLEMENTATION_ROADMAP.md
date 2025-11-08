# AI 功能实施路线图

## 🎯 实施优先级

### Phase 1: 快速实现（1-2周）🔥

#### 1. 基于食材的智能食谱生成
**价值:** ⭐⭐⭐⭐⭐  
**难度:** 中等  
**成本:** 低-中等

**实现步骤:**
1. 创建后端 API: `/api/generate-recipe-from-ingredients`
2. 创建前端服务: `aiService.generateRecipeFromIngredients`
3. 在 HomeScreen 添加 "Generate Recipe" 按钮
4. 创建 `GenerateRecipeModal` 组件

**技术实现:**
```javascript
// server/server.js
app.post('/api/generate-recipe-from-ingredients', async (req, res) => {
  const { ingredients, dietaryRestrictions, cuisine, servings } = req.body;
  
  const prompt = `Generate a recipe using these ingredients: ${ingredients.join(', ')}
  ${dietaryRestrictions ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
  ${cuisine ? `Cuisine: ${cuisine}` : ''}
  ${servings ? `Servings: ${servings}` : ''}
  
  Return a complete recipe with title, description, ingredients, instructions, cooking time, and servings.`;
  
  // Use OpenAI to generate recipe
});
```

**UI 设计:**
- 食材输入（多选或输入）
- 饮食限制选择（素食、无麸质等）
- 菜系选择（可选）
- 生成按钮

---

#### 2. 营养分析
**价值:** ⭐⭐⭐⭐  
**难度:** 低  
**成本:** 低

**实现步骤:**
1. 创建后端 API: `/api/analyze-nutrition`
2. 在 RecipeDetailScreen 添加 "Nutrition" 标签
3. 显示营养成分表

**技术实现:**
```javascript
// server/server.js
app.post('/api/analyze-nutrition', async (req, res) => {
  const { recipe } = req.body;
  
  const prompt = `Analyze the nutritional value of this recipe:
  Title: ${recipe.title}
  Ingredients: ${JSON.stringify(recipe.ingredients)}
  Servings: ${recipe.servings}
  
  Return nutritional information per serving:
  - Calories
  - Protein (g)
  - Fat (g)
  - Carbohydrates (g)
  - Fiber (g)
  - Sugar (g)
  - Sodium (mg)`;
  
  // Use OpenAI to analyze
});
```

**UI 设计:**
- 营养成分卡片
- 营养圆环图
- 每日目标进度

---

#### 3. 烹饪建议和提示
**价值:** ⭐⭐⭐⭐  
**难度:** 低  
**成本:** 低

**实现步骤:**
1. 创建后端 API: `/api/cooking-tips`
2. 在 CookStepScreen 添加 "Tips" 按钮
3. 显示当前步骤的烹饪建议

**技术实现:**
```javascript
// server/server.js
app.post('/api/cooking-tips', async (req, res) => {
  const { recipe, currentStep, userExperience } = req.body;
  
  const prompt = `Provide cooking tips for this step:
  Recipe: ${recipe.title}
  Step ${currentStep}: ${recipe.instructions[currentStep - 1].description}
  User experience level: ${userExperience}
  
  Provide 3-5 helpful tips for this step.`;
  
  // Use OpenAI to generate tips
});
```

**UI 设计:**
- 提示卡片（可折叠）
- 图标提示
- 语音播放提示

---

### Phase 2: 核心功能（2-3周）⭐

#### 4. 智能食谱推荐
**价值:** ⭐⭐⭐⭐⭐  
**难度:** 高  
**成本:** 中等

**实现步骤:**
1. 设置 Supabase Vector Extension (pgvector)
2. 创建食谱向量生成服务
3. 实现推荐算法
4. 在 HomeScreen 添加 "Recommended for You" 部分

**技术实现:**
```javascript
// 使用 OpenAI Embeddings
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: recipeText
});

// 存储到 Supabase
await supabase.from('recipe_embeddings').insert({
  recipe_id: recipeId,
  embedding: embedding.data[0].embedding
});

// 推荐算法
const recommendations = await supabase.rpc('match_recipes', {
  query_embedding: userPreferenceEmbedding,
  match_threshold: 0.7,
  match_count: 10
});
```

**UI 设计:**
- 推荐食谱卡片
- "Why recommended?" 解释
- 刷新推荐按钮

---

#### 5. 食材替换建议
**价值:** ⭐⭐⭐  
**难度:** 低  
**成本:** 低

**实现步骤:**
1. 创建后端 API: `/api/suggest-substitution`
2. 在 RecipeDetailScreen 的食材列表中添加替换按钮
3. 显示替换建议

**技术实现:**
```javascript
// server/server.js
app.post('/api/suggest-substitution', async (req, res) => {
  const { ingredient, reason, recipeContext } = req.body;
  
  const prompt = `Suggest substitutes for ${ingredient} in this context: ${recipeContext}
  Reason for substitution: ${reason}
  
  Provide 3-5 substitute options with:
  - Name
  - Ratio (if different)
  - Notes`;
  
  // Use OpenAI to suggest
});
```

**UI 设计:**
- 替换建议模态框
- 替换原因选择
- 一键替换功能

---

#### 6. 智能标签生成
**价值:** ⭐⭐⭐  
**难度:** 低  
**成本:** 低

**实现步骤:**
1. 在创建食谱时自动生成标签
2. 使用 AI 分析食谱内容
3. 提取关键标签

**技术实现:**
```javascript
// 在创建/更新食谱时自动调用
const tags = await generateTags(recipe);
// 自动添加到食谱
```

**UI 设计:**
- 自动标签显示
- 用户可以编辑
- 标签建议

---

### Phase 3: 高级功能（3-4周）🚀

#### 7. 个性化食谱定制
**价值:** ⭐⭐⭐⭐  
**难度:** 中等  
**成本:** 中等

#### 8. 智能搜索
**价值:** ⭐⭐⭐⭐  
**难度:** 中等  
**成本:** 中等

#### 9. 其他功能
根据用户反馈决定

---

## 💻 代码示例

### 1. 基于食材生成食谱 API

```javascript
// server/server.js
app.post('/api/generate-recipe-from-ingredients', async (req, res) => {
  try {
    const { ingredients, dietaryRestrictions, cuisine, servings } = req.body;
    
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients are required' });
    }
    
    const prompt = `You are a professional chef. Create a delicious recipe using these ingredients: ${ingredients.join(', ')}
    
${dietaryRestrictions && dietaryRestrictions.length > 0 ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${cuisine ? `Cuisine style: ${cuisine}` : ''}
${servings ? `Servings: ${servings}` : 'Servings: 4'}

Return a complete recipe following this JSON schema:
{
  "title": "Recipe title (6 words or less)",
  "description": "Brief description",
  "ingredients": [{"name": "ingredient", "amount": "amount", "unit": "unit"}],
  "instructions": [{"step": 1, "description": "instruction"}],
  "cookingTime": "time",
  "servings": "servings",
  "tags": ["tag1", "tag2"],
  "cookware": "cookware"
}`;
    
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional chef creating recipes." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_schema", json_schema: {
        name: "recipe_generation",
        schema: RECIPE_JSON_SCHEMA,
        strict: true
      }}
    });
    
    const recipe = completion.choices[0].message.parsed;
    const completeRecipe = generateCompleteRecipeSchema(recipe);
    
    res.json(completeRecipe);
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});
```

### 2. 营养分析 API

```javascript
// server/server.js
app.post('/api/analyze-nutrition', async (req, res) => {
  try {
    const { recipe } = req.body;
    
    const prompt = `Analyze the nutritional value of this recipe per serving:
    
Title: ${recipe.title}
Servings: ${recipe.servings || 4}
Ingredients:
${recipe.ingredients.map(ing => `- ${ing.amount} ${ing.unit} ${ing.name}`).join('\n')}

Provide nutritional information in JSON format:
{
  "calories": number,
  "protein": number (grams),
  "fat": number (grams),
  "carbohydrates": number (grams),
  "fiber": number (grams),
  "sugar": number (grams),
  "sodium": number (milligrams),
  "vitamins": ["vitamin names"],
  "minerals": ["mineral names"]
}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a nutritionist analyzing recipes." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    const nutrition = JSON.parse(completion.choices[0].message.content);
    res.json(nutrition);
  } catch (error) {
    console.error('Error analyzing nutrition:', error);
    res.status(500).json({ error: 'Failed to analyze nutrition' });
  }
});
```

### 3. 烹饪建议 API

```javascript
// server/server.js
app.post('/api/cooking-tips', async (req, res) => {
  try {
    const { recipe, currentStep, userExperience = 'intermediate' } = req.body;
    
    const currentInstruction = recipe.instructions[currentStep - 1];
    
    const prompt = `Provide helpful cooking tips for this step in the recipe "${recipe.title}":
    
Current Step ${currentStep}: ${currentInstruction.description}

Previous steps context:
${recipe.instructions.slice(0, currentStep - 1).map((inst, idx) => `Step ${idx + 1}: ${inst.description}`).join('\n')}

User experience level: ${userExperience}

Provide 3-5 concise, actionable tips in JSON format:
{
  "tips": [
    {"title": "tip title", "description": "tip description", "icon": "icon-name"}
  ],
  "commonMistakes": ["mistake1", "mistake2"],
  "timeEstimate": "estimated time for this step"
}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a cooking instructor providing helpful tips." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    const tips = JSON.parse(completion.choices[0].message.content);
    res.json(tips);
  } catch (error) {
    console.error('Error getting cooking tips:', error);
    res.status(500).json({ error: 'Failed to get cooking tips' });
  }
});
```

---

## 🎨 UI/UX 设计建议

### 1. AI 功能入口
- 在 HomeScreen 添加 "AI Features" 部分
- 使用图标和简短描述
- 突出 AI 功能的优势

### 2. 生成食谱模态框
- 食材输入（支持多选、搜索）
- 饮食限制选择
- 生成按钮（显示加载状态）
- 预览生成的食谱

### 3. 营养分析展示
- 营养成分卡片
- 营养圆环图
- 每日目标进度条
- 营养建议文字

### 4. 烹饪提示
- 提示卡片（可折叠）
- 图标提示
- 语音播放选项
- 常见错误警告

---

## 💰 成本估算

### OpenAI API 成本

| 功能 | 模型 | 平均 Token | 成本/请求 | 月请求量 | 月成本 |
|------|------|-----------|----------|---------|--------|
| 生成食谱 | gpt-4o-mini | 2000 | $0.001 | 1000 | $1 |
| 营养分析 | gpt-4o-mini | 500 | $0.0003 | 2000 | $0.6 |
| 烹饪建议 | gpt-4o-mini | 300 | $0.0002 | 5000 | $1 |
| 食材替换 | gpt-4o-mini | 200 | $0.0001 | 1000 | $0.1 |
| 推荐系统 | text-embedding-3-small | 100 | $0.00001 | 5000 | $0.05 |
| **总计** | | | | | **~$3/月** |

*基于 1000 活跃用户的估算

### 优化策略
1. **缓存结果**: 缓存常见查询（如营养分析）
2. **批量处理**: 批量生成标签
3. **限制使用**: 设置每日/每月使用限制
4. **模型选择**: 根据任务选择合适的模型

---

## 📊 实施时间表

### Week 1-2: Phase 1
- [ ] 基于食材生成食谱
- [ ] 营养分析
- [ ] 烹饪建议

### Week 3-4: Phase 2
- [ ] 智能推荐系统
- [ ] 食材替换
- [ ] 智能标签

### Week 5-6: Phase 3
- [ ] 个性化定制
- [ ] 智能搜索
- [ ] 其他功能

---

## ✅ 成功指标

### 用户指标
- AI 功能使用率 > 30%
- 用户满意度 > 4.5/5
- 用户留存率提升 20%

### 技术指标
- API 响应时间 < 3秒
- 错误率 < 1%
- 成本控制在预算内

---

**最后更新：** 2025-01-XX
**状态：** 规划中 📋

