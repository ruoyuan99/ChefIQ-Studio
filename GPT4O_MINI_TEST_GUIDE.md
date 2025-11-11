# GPT-4o-mini 测试指南

## 配置更改

### 1. 环境变量
`.env` 文件已更新为使用 `gpt-4o-mini`:
```bash
OPENAI_MODEL_RECIPE=gpt-4o-mini
```

### 2. 代码增强
- ✅ 添加了 Stage 1 和 Stage 2 的详细 token 使用日志
- ✅ 添加了成本计算和显示
- ✅ 添加了模型类型显示（gpt-4o 或 gpt-4o-mini）

## 测试步骤

### 1. 启动服务器
服务器已配置为使用 `gpt-4o-mini`，并在启动时显示：
```
🤖 Using model for recipe generation: gpt-4o-mini
💰 Cost-saving mode: Using gpt-4o-mini (93% cheaper than gpt-4o)
⚠️  Note: Recipe quality may be slightly lower. Monitor token usage and quality.
```

### 2. 测试生成食谱

#### 测试用例 1: 简单食材
- **输入**: Chicken, Tomato, Onion
- **Cookware**: Air Fryer
- **预期**: 3 个不同的食谱，标题应该多样化

#### 测试用例 2: 复杂食材
- **输入**: Tofu, Coconut Milk, Curry Powder, Garlic, Ginger
- **Cookware**: Slow Cooker
- **Cooking Time**: Quick
- **预期**: 3 个快速食谱，标题应该多样化

#### 测试用例 3: 多种限制
- **输入**: Salmon, Lemon, Herbs, Olive Oil
- **Cookware**: Oven
- **Cooking Time**: Medium
- **Servings**: 4
- **Cuisine**: Mediterranean
- **预期**: 3 个地中海风格的中等时间食谱

### 3. 监控日志

#### Stage 1 日志
```
📝 Stage 1: Generating recipe concept outlines using gpt-4o-mini...
📊 Stage 1 (gpt-4o-mini) token usage: 1200 prompt + 900 completion = 2100 total
💰 Stage 1 cost: $0.000900
✅ Stage 1 completed. Concept outlines generated.
```

#### Stage 2 日志
```
📝 Stage 2: Generating detailed recipes from concepts...
📊 Stage 2 (gpt-4o-mini) token usage: 1800 prompt + 3200 completion = 5000 total
💰 Stage 2 cost: $0.002160
💰 Total recipe generation cost: $0.003060 (Stage 1: $0.000900 + Stage 2: $0.002160)
📋 Generated recipes: Air Fryer Crispy Chicken Tacos | Slow Cooker Thai Red Curry | Pan-Seared Salmon with Lemon Herbs
```

## 质量评估指标

### 1. 标题多样性 ✅
- [ ] 三个食谱的标题完全不同
- [ ] 标题包含具体的菜类型（Tacos, Curry, Soup 等）
- [ ] 标题不包含通用后缀（Supper, Feast, Showcase）
- [ ] 标题反映不同的烹饪风格或菜系

### 2. 食谱详细程度 ✅
- [ ] 每个食谱有至少 5 个步骤
- [ ] 步骤包含具体的烹饪时间和温度
- [ ] 食材列表包含数量和单位
- [ ] 描述清晰且实用

### 3. 真实性 ✅
- [ ] 食谱看起来像真实可做的食谱
- [ ] 食材组合合理
- [ ] 烹饪方法符合实际
- [ ] 步骤顺序合理

### 4. 规则遵循 ✅
- [ ] 所有食谱使用指定的 cookware
- [ ] 烹饪时间符合要求（如果指定）
- [ ] 份量符合要求（如果指定）
- [ ] 菜系风格符合要求（如果指定）
- [ ] 饮食限制得到尊重（如果指定）

### 5. 多样性 ✅
- [ ] 三个食谱使用不同的主要食材
- [ ] 三个食谱有不同的菜类型
- [ ] 三个食谱有不同的风味特征
- [ ] 三个食谱有不同的烹饪技巧

## 成本对比

### 使用 GPT-4o-mini（当前）
- **每次查询**: ~$0.0039
- **1000 次查询**: ~$3.9
- **10000 次查询**: ~$39

### 使用 GPT-4o（之前）
- **每次查询**: ~$0.057
- **1000 次查询**: ~$57
- **10000 次查询**: ~$570

### 节省
- **每次查询**: 节省 $0.0531 (93%)
- **1000 次查询**: 节省 $53.1
- **10000 次查询**: 节省 $531

## 如果质量不满意

### 选项 1: 调整 Prompt
- 增加更多具体的要求
- 添加更多示例
- 强调多样性和真实性

### 选项 2: 混合方案
- Stage 1 使用 `gpt-4o-mini`（概念生成）
- Stage 2 使用 `gpt-4o`（详细食谱生成）
- 成本: ~$0.042 per query（节省 26%）

### 选项 3: 回到 GPT-4o
- 设置 `OPENAI_MODEL_RECIPE=gpt-4o`
- 最高质量，但成本较高

## 测试结果记录

### 测试日期: ___________

#### 测试用例 1
- **输入**: ___________
- **结果**: 
  - 标题: ___________
  - 质量评分: ___/5
  - Token 使用: ___
  - 成本: $___

#### 测试用例 2
- **输入**: ___________
- **结果**: 
  - 标题: ___________
  - 质量评分: ___/5
  - Token 使用: ___
  - 成本: $___

#### 测试用例 3
- **输入**: ___________
- **结果**: 
  - 标题: ___________
  - 质量评分: ___/5
  - Token 使用: ___
  - 成本: $___

## 结论

- [ ] 质量可接受，继续使用 `gpt-4o-mini`
- [ ] 质量不够，需要调整 prompt
- [ ] 质量不够，考虑混合方案
- [ ] 质量不够，回到 `gpt-4o`

## 下一步

1. 运行测试用例
2. 记录测试结果
3. 评估质量
4. 决定是否继续使用 `gpt-4o-mini` 或调整方案

