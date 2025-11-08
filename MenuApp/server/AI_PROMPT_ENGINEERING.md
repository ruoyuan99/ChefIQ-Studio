# AI Prompt Engineering Guide

## 当前实现概述

后端使用 **OpenAI Structured Outputs** 来确保 AI 返回的数据严格符合 JSON Schema。这有两个主要功能：

1. **Recipe Extraction（提取）** - 从网页提取 recipe 信息
2. **Recipe Optimization（优化）** - 优化已有的 recipe

---

## 1. Recipe Extraction（提取）

### API 调用方式

```javascript
const completion = await openai.beta.chat.completions.parse({
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are a recipe extraction expert. Extract recipe information from web pages following the exact JSON schema provided.'
    },
    {
      role: 'user',
      content: prompt  // 包含网页内容和提取指令
    }
  ],
  temperature: 0.2,  // 低温度，更准确
  max_tokens: 2000,
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'recipe_extraction',
      strict: true,
      schema: RECIPE_JSON_SCHEMA
    }
  }
});
```

### Prompt 设计

**System Prompt（系统提示）：**
```
You are a recipe extraction expert. Extract recipe information from web pages following the exact JSON schema provided.
```

**User Prompt（用户提示）：**
```
Extract recipe information from the following webpage content.

URL: {url}
Title: {title}

Webpage Content:
{contentText}

Extract ALL ingredients and instructions, even if they are in a list format.
For ingredients, extract amount as a number and unit separately when possible.
For instructions, number them sequentially starting from 1.
Only include information that is clearly a recipe.
If cooking time or servings are mentioned, include them.
```

### Prompt Engineering 技巧

1. **明确角色定位**：`You are a recipe extraction expert` - 让 AI 知道它的角色
2. **具体指令**：`Extract ALL ingredients and instructions` - 强调提取所有内容
3. **格式要求**：`extract amount as a number and unit separately` - 明确数据结构
4. **边界条件**：`Only include information that is clearly a recipe` - 避免提取无关内容
5. **数据预处理**：使用 Cheerio 清理 HTML，移除脚本、样式、广告等

### 参数设置

- **temperature: 0.2** - 低温度确保提取准确性
- **max_tokens: 2000** - 限制输出长度
- **strict: true** - 严格模式，必须完全符合 Schema

---

## 2. Recipe Optimization（优化）

### API 调用方式

```javascript
const completion = await openai.beta.chat.completions.parse({
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: systemPrompt  // 详细的优化指令
    },
    {
      role: 'user',
      content: `Please optimize this recipe:\n\n${recipeText}`
    }
  ],
  temperature: 0.7,  // 较高温度，更有创造性
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'recipe_optimization',
      description: 'Optimized recipe with improved title, description, ingredients, and instructions',
      strict: true,
      schema: RECIPE_JSON_SCHEMA
    }
  }
});
```

### Prompt 设计

**System Prompt（系统提示）：**
```
You are a professional recipe editor. Optimize and improve the given recipe by:

1. Making the title more appealing and descriptive
2. Enhancing the description to be more engaging
3. Standardizing ingredient names and amounts (convert to consistent units)
4. Improving instruction clarity and step-by-step flow
5. Adding relevant tags if missing
6. Ensuring cooking time and servings are accurate
7. Suggesting appropriate cookware if missing

Keep the recipe authentic and maintain its original character while making it more professional and user-friendly.
```

**User Prompt（用户提示）：**
```
Please optimize this recipe:

Title: {title}
Description: {description}
Cooking Time: {cookingTime}
Servings: {servings}
Tags: {tags}
Cookware: {cookware}

Ingredients:
1. {ingredient1}
2. {ingredient2}
...

Instructions:
1. {instruction1}
2. {instruction2}
...
```

### Prompt Engineering 技巧

1. **分点列出任务**：1-7 条明确优化方向
2. **平衡指令**：`Keep the recipe authentic` - 保持原始特色
3. **专业角色**：`professional recipe editor` - 强调专业性
4. **结构化输入**：将 recipe 格式化展示，便于 AI 理解
5. **明确目标**：`more professional and user-friendly` - 明确优化目标

### 参数设置

- **temperature: 0.7** - 较高温度，允许更多创造性优化
- **strict: true** - 严格模式，确保输出符合 Schema

---

## JSON Schema 设计

### 关键要点

1. **Strict Mode（严格模式）**：
   - `strict: true` - 强制完全符合 Schema
   - `additionalProperties: false` - 不允许额外属性

2. **Required Fields（必需字段）**：
   - 所有在 `properties` 中定义的字段，要么在 `required` 中，要么类型允许 `null`

3. **Schema Structure（结构）**：
   ```javascript
   {
     type: 'object',
     properties: { ... },
     required: [...],
     additionalProperties: false  // 必须设置
   }
   ```

### 当前 Schema 要求

- **ingredients.items**: `required: ['name', 'amount', 'unit']`
- **instructions.items**: `required: ['step', 'description']`
- **根对象**: `required: ['title', 'description', 'ingredients', 'instructions', 'cookingTime', 'servings', 'tags', 'cookware']`

---

## 优化建议

### 1. 提取（Extraction）优化

**当前 temperature: 0.2** - 适合提取任务
- ✅ 准确性高
- ✅ 输出稳定
- ⚠️ 如果提取不够完整，可以尝试 0.3-0.4

**Prompt 改进建议**：
```
更详细的提取指令：
- 提取所有食材，包括数量、单位、名称
- 提取所有步骤，保持原有顺序
- 如果食材有替代品或备注，保留在描述中
- 提取任何特殊的烹饪技巧或注意事项
```

### 2. 优化（Optimization）优化

**当前 temperature: 0.7** - 适合优化任务
- ✅ 有一定创造性
- ✅ 保持合理性
- ⚠️ 如果优化过于激进，可以降低到 0.5-0.6

**Prompt 改进建议**：
```
更具体的优化指令：
- 标题：使用吸引人的形容词，但保持简洁（10-15字）
- 描述：突出菜品的特色和口感，50-100字
- 食材：统一单位（统一使用公制或英制），简化描述
- 步骤：每步一个动作，清晰明确，避免歧义
- 标签：添加3-5个相关标签（菜系、难度、主要食材等）
```

### 3. 错误处理

当前实现：
- ✅ 有 try-catch 错误处理
- ✅ 有详细的错误日志
- ⚠️ 可以添加重试机制（如果 API 调用失败）

### 4. 成本优化

**当前模型：gpt-4o-mini**
- ✅ 成本低
- ✅ 速度快
- ⚠️ 如果质量不够，可以尝试 `gpt-4o` 或 `gpt-4-turbo`

**Token 优化**：
- 当前限制 contentText 为 8000 字符
- 可以进一步优化：只提取关键内容，移除重复文本

---

## 测试和调试

### 测试不同 Prompt

1. **修改 System Prompt**：
   ```javascript
   content: 'You are a professional recipe editor...'  // 修改这里
   ```

2. **修改 User Prompt**：
   ```javascript
   content: `Please optimize this recipe:\n\n${recipeText}`  // 修改这里
   ```

3. **调整参数**：
   ```javascript
   temperature: 0.7,  // 尝试不同值：0.3, 0.5, 0.7, 0.9
   ```

### 查看日志

服务器日志会显示：
- `🤖 Optimizing recipe with AI: {title}` - 开始优化
- `📸 Preserved original image: {imageUrl}` - 保留图片
- `✅ AI optimized recipe: {title}` - 优化完成

### 常见问题

1. **Schema 验证失败**：
   - 检查 `additionalProperties: false` 是否在所有对象中
   - 检查所有 `properties` 中的字段是否都在 `required` 中

2. **提取不完整**：
   - 增加 `max_tokens`
   - 改进 prompt，更明确地要求提取所有内容

3. **优化过于激进**：
   - 降低 `temperature` 到 0.5-0.6
   - 在 prompt 中强调"保持原始特色"

---

## 最佳实践

1. **明确角色**：始终在 System Prompt 中定义 AI 的角色
2. **分点列出**：使用数字列表（1, 2, 3...）让指令更清晰
3. **提供示例**：在 prompt 中可以包含期望的输出格式示例
4. **平衡约束**：既要明确要求，又要保持灵活性
5. **测试迭代**：根据实际效果调整 prompt 和参数

---

## 下一步优化方向

1. **多轮对话**：如果提取不完整，允许用户反馈并重新提取
2. **自定义优化**：允许用户选择优化方向（标题、描述、步骤等）
3. **上下文记忆**：记住用户的偏好，优化更符合用户风格
4. **成本监控**：记录每次 API 调用的 token 使用量，优化成本

