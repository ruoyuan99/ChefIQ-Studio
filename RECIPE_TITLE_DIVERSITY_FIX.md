# 食谱标题多样性问题修复

## 问题描述

用户反馈：无论输入什么食材，生成的食谱标题总是只有 "Supper", "Feast", "Showcase" 三种结果，缺乏多样性。

**示例问题标题**：
- "Chicken Air Fryer Supper"
- "Chicken Air Fryer Feast"
- "Chicken Air Fryer Showcase"

## 问题原因

1. **Mock 模式启用**：`DISABLE_AI_RECIPE_GENERATION=true` 导致系统使用 mock 模式
2. **Mock 标题模板固定**：Mock 模式的标题模板只根据第一个食材和 cookware 生成，缺乏多样性
3. **AI Prompt 不够明确**：即使使用 AI 生成，prompt 没有明确要求避免通用后缀

## 解决方案

### 1. 启用真实 AI 生成

**修改**：将 `.env` 文件中的 `DISABLE_AI_RECIPE_GENERATION` 设为 `false`

```bash
DISABLE_AI_RECIPE_GENERATION=false
```

### 2. 改进 Stage 1 Prompt（概念生成阶段）

**添加的要求**：
- 每个概念必须包含**具体的菜类型**（如 "Tacos", "Curry", "Soup", "Stir-Fry", "Salad", "Roast"）
- 每个概念必须包含**标题建议**，避免通用后缀
- 明确禁止使用 "Supper", "Feast", "Showcase", "Dish", "Meal" 等通用术语

**新增字段**：
- `Dish Type`: 具体的菜类型（如 "Tacos", "Curry", "Soup"）
- `Cuisine Style`: 菜系风格（如 "Italian", "Thai", "Mexican"）
- `Title Suggestion`: 具体的标题建议（如 "Air Fryer Crispy Chicken Tacos"）

### 3. 改进 Stage 2 Prompt（详细食谱生成阶段）

**添加的要求**：
- **明确的标题要求**：每个标题必须包含具体的菜类型、菜系风格或烹饪技巧
- **禁止通用后缀**：明确禁止使用 "Supper", "Feast", "Showcase", "Dish", "Meal"
- **好的标题示例**：
  - "Air Fryer Crispy Chicken Tacos with Avocado"
  - "Slow Cooker Thai Red Curry with Tofu"
  - "Pan-Seared Salmon with Lemon Herbs"
- **坏的标题示例**：
  - "Chicken Air Fryer Supper" ❌
  - "Salmon Air Fryer Feast" ❌
  - "Tofu Air Fryer Showcase" ❌

### 4. 增强标题多样性要求

**要求**：
- 每个标题必须包含**具体的菜类型**（如 "Tacos", "Curry", "Soup", "Stir-Fry", "Salad", "Roast", "Skewers", "Wraps"）
- 每个标题必须包含**菜系风格**或**烹饪技巧**（如 "Thai", "Italian", "Crispy", "Braised", "Marinated"）
- 三个标题必须**完全不同**，反映不同的菜类型和风格

## 修改的文件

### `MenuApp/server/server.js`

1. **Stage 1 Prompt**（第 2334-2385 行）：
   - 添加了 `Dish Type` 字段要求
   - 添加了 `Cuisine Style` 字段要求
   - 添加了 `Title Suggestion` 字段要求
   - 添加了禁止通用后缀的要求

2. **Stage 2 Prompt**（第 2542-2550 行，第 2754-2772 行，第 2853-2870 行）：
   - 添加了明确的标题要求
   - 添加了好的和坏的标题示例
   - 添加了禁止通用后缀的要求

3. **示例部分**（第 2625-2642 行）：
   - 更新了示例标题，展示具体的、描述性的标题
   - 添加了更多好的标题示例
   - 添加了需要避免的通用模式

### `MenuApp/server/.env`

- 将 `DISABLE_AI_RECIPE_GENERATION` 从 `true` 改为 `false`

## 预期效果

### 修复前
- 标题：`"Chicken Air Fryer Supper"`, `"Chicken Air Fryer Feast"`, `"Chicken Air Fryer Showcase"`
- 问题：缺乏多样性，只有后缀不同

### 修复后
- 标题示例：
  - `"Air Fryer Crispy Chicken Tacos with Avocado"`
  - `"Slow Cooker Thai Red Curry with Tofu"`
  - `"Pan-Seared Salmon with Lemon Herbs"`
- 改进：每个标题都包含具体的菜类型、菜系风格或烹饪技巧，完全不同的烹饪体验

## 测试建议

1. **重启服务器**：确保新的环境变量和代码生效
2. **测试不同食材**：尝试不同的食材组合，验证标题的多样性
3. **验证标题格式**：确保标题包含具体的菜类型，而不是通用后缀
4. **检查多样性**：确保三个食谱选项的标题完全不同

## 后续优化

如果问题仍然存在，可以考虑：

1. **增加温度参数**：提高 `temperature` 值以增加创意性（当前为 0.7-0.85）
2. **增强多样性检查**：在后处理阶段检查标题相似度，如果太相似则重新生成
3. **添加标题验证**：验证生成的标题是否包含具体的菜类型
4. **改进示例**：提供更多样化的标题示例

## 注意事项

- 确保 `OPENAI_API_KEY` 已正确配置
- 确保 `DISABLE_AI_RECIPE_GENERATION=false`（已修复）
- 重启服务器以使更改生效
- 如果问题仍然存在，检查服务器日志以查看 AI 生成的标题

