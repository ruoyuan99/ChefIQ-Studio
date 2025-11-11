# 两阶段提示优化 (Two-Stage Prompt Optimization)

## 概述

实现了两阶段提示优化，提升食谱生成质量：
1. **第一阶段**: 生成三个食谱构想概要（自然语言）
2. **第二阶段**: 基于构想概要生成详细的JSON格式食谱

## 实现方式

### 后端内部两阶段（当前实现）

目前在后端内部自动执行两阶段流程，前端无需修改：

```
用户请求 → 后端Stage 1 → 后端Stage 2 → 返回完整食谱
```

### 未来可扩展为前端交互两阶段

未来可以实现前端交互式两阶段：

```
用户请求 → 后端Stage 1 → 前端显示构想 → 用户选择 → 后端Stage 2 → 返回完整食谱
```

## 第一阶段：生成构想概要

### 目标
- 专注于创意和构思
- 生成三个不同的食谱概念
- 不需要JSON格式，使用自然语言

### Prompt特点
- **Temperature**: 0.9（更高的创造性）
- **Max Tokens**: 1500（足够三个详细构想）
- **格式**: 自然语言，结构化大纲
- **无JSON Schema约束**（更灵活的创意）

### 输出格式
每个构想包含：
- **Main Ingredients**: 主要食材（2-4个）
- **Flavor Profile**: 风味特点
- **Cooking Technique**: 烹饪技巧
- **Dish Type**: 菜品类型
- **Unique Selling Point**: 独特卖点

### 示例输出
```
Concept 1 - Classic/Traditional Style:
- Main Ingredients: Chicken, Tomato, Onion
- Flavor Profile: Simple, classic, familiar flavors
- Cooking Technique: One-pot, straightforward method
- Dish Type: Main dish, curry
- Unique Selling Point: Comforting, family-friendly meal

Concept 2 - Modern/Fusion Style:
- Main Ingredients: Chicken, Bell Pepper, Garlic
- Flavor Profile: Bold, complex, exotic flavors
- Cooking Technique: Multi-step, layering flavors
- Dish Type: Appetizer, skewers
- Unique Selling Point: Creative fusion of flavors

Concept 3 - Gourmet/Elevated Style:
- Main Ingredients: Chicken, Herbs, Wine
- Flavor Profile: Sophisticated, refined, delicate flavors
- Cooking Technique: Advanced, unique method
- Dish Type: Main dish, elegant presentation
- Unique Selling Point: Restaurant-quality sophistication
```

## 第二阶段：生成详细食谱

### 目标
- 基于第一阶段的构想概要
- 生成完整、详细的食谱
- 严格的JSON格式输出

### Prompt特点
- **Temperature**: 0.8（平衡创造性和准确性）
- **格式**: JSON Schema (strict mode)
- **基于构想概要**: 严格按照Stage 1的概念生成
- **详细要求**: 包含具体时间、温度、技巧

### 输入
- Stage 1生成的构想概要
- 用户要求（厨具、时间、份数、菜系、饮食限制）

### 输出
- 完整的JSON格式食谱
- 每个食谱包含：title, description, ingredients, instructions, cookingTime, servings, tags, cookware

## 优势

### 1. 分离关注点
- **Stage 1**: 专注于创意和构思
- **Stage 2**: 专注于详细实现和格式化

### 2. 提升质量
- 第一阶段可以更自由地探索创意
- 第二阶段有明确的指导，生成更准确的食谱
- 减少"随机组合"的问题

### 3. 更好的差异化
- 第一阶段明确要求三个不同的概念
- 第二阶段严格按照概念执行，确保差异化

### 4. 错误恢复
- 如果Stage 1失败，自动回退到单阶段模式
- 确保系统始终可用

## 成本分析

### Token使用
- **Stage 1**: 
  - 输入: ~800-1000 tokens (prompt)
  - 输出: ~800-1200 tokens (三个构想概要)
  - 总计: ~1600-2200 tokens

- **Stage 2**:
  - 输入: ~2000-3000 tokens (prompt + 构想概要)
  - 输出: ~2000-4000 tokens (三个完整食谱)
  - 总计: ~4000-7000 tokens

- **总计**: ~5600-9200 tokens per recipe generation

### 成本对比（使用 gpt-4o）
- **单阶段**: ~3500-4500 tokens = $0.035-0.045
- **两阶段**: ~5600-9200 tokens = $0.056-0.092
- **成本增加**: 约 1.6-2倍

### 性价比
- 虽然成本增加，但质量显著提升
- 生成的食谱更真实、更实用
- 减少用户重新生成的次数
- 总体成本可能更低（更少的重复请求）

## 错误处理

### Stage 1失败
- 自动回退到单阶段模式
- 使用原始prompt方法
- 确保系统始终可用
- 记录错误日志

### Stage 2失败
- 返回错误信息
- 提供详细的调试信息
- 建议用户重试

## 日志记录

### Stage 1日志
```
📝 Stage 1: Generating recipe concept outlines...
✅ Stage 1 completed. Concept outlines generated.
📋 Concept outlines preview: [preview]...
📊 Stage 1 token usage: [usage]...
```

### Stage 2日志
```
📝 Stage 2: Generating detailed recipes from concepts...
✅ Stage 2 completed. Recipes generated.
📊 Stage 2 token usage: [usage]...
```

## 配置选项

### 环境变量
```bash
# 食谱生成模型（两阶段都使用）
OPENAI_MODEL_RECIPE=gpt-4o

# 禁用AI食谱生成（会跳过两阶段，使用mock数据）
DISABLE_AI_RECIPE_GENERATION=false
```

### 代码配置
- Stage 1 Temperature: 0.9（可调整）
- Stage 2 Temperature: 0.8（可调整）
- Stage 1 Max Tokens: 1500（可调整）

## 未来优化

### 1. 前端交互式两阶段
- 第一阶段完成后，在前端显示三个构想
- 用户可以选择一个或多个构想
- 只生成选定的构想的详细食谱
- 节省成本，提升用户体验

### 2. 缓存机制
- 缓存常见的食材组合的构想概要
- 减少重复的Stage 1调用
- 降低成本

### 3. 并行处理
- Stage 2可以并行生成三个食谱
- 减少总体响应时间

### 4. 质量评分
- 对生成的构想概要进行质量评分
- 只使用高质量的构想概要
- 提升最终食谱质量

## 测试建议

### 1. 对比测试
- 对比单阶段和两阶段生成的质量
- 评估成本差异
- 评估用户满意度

### 2. 质量评估
- 检查食谱是否真实、实用
- 检查三个食谱是否显著不同
- 检查是否符合用户要求

### 3. 性能测试
- 测量两阶段的响应时间
- 评估token使用情况
- 优化性能瓶颈

## 代码位置

- **Stage 1实现**: `MenuApp/server/server.js` (第1961-2000行)
- **Stage 2实现**: `MenuApp/server/server.js` (第2002-2331行)
- **错误处理**: `MenuApp/server/server.js` (第1995-2000行)
- **Fallback模式**: `MenuApp/server/server.js` (第2024-2113行)

## 总结

两阶段提示优化通过分离创意和实现，显著提升了食谱生成质量。虽然成本略有增加，但生成的食物更真实、更实用，用户体验更好。未来可以通过前端交互、缓存机制等方式进一步优化成本和用户体验。

