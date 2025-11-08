# AI Token Usage Logging

## 概述

系统现在会自动记录每次AI API调用的token使用情况，包括：
- Prompt tokens（输入token）
- Completion tokens（输出token）
- Total tokens（总token）
- 成本估算

## 功能

### 1. 自动日志记录

每次调用OpenAI API时，系统会自动记录：
- 使用的模型
- Token使用量（输入/输出/总计）
- 估算成本
- 端点信息
- 时间戳

### 2. 日志格式

#### 详细日志
```
📊 AI Token Usage Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endpoint: extract-recipe
Model: gpt-4o-mini
URL: https://example.com/recipe
Recipe: Chocolate Cake
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tokens:
  • Prompt: 1,234 tokens
  • Completion: 567 tokens
  • Total: 1,801 tokens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cost: $0.001234 (1.234 cents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 简洁日志
```
💰 [extract-recipe] 1,801 tokens (1,234 + 567) = $0.001234
```

### 3. 支持的端点

- **extract-recipe** - 从网页提取食谱
- **optimize-recipe** - 优化食谱
- **scan-recipe** - 从图片扫描食谱
- **import-recipe-text** - 从文本导入食谱

### 4. 成本计算

系统根据当前OpenAI定价自动计算成本：

| 模型 | 输入 (1M tokens) | 输出 (1M tokens) |
|------|-----------------|-----------------|
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4o | $2.50 | $10.00 |
| gpt-4-turbo | $10.00 | $30.00 |
| gpt-3.5-turbo | $0.50 | $1.50 |

## 使用示例

### 查看日志

当AI功能被调用时，控制台会自动显示token使用情况：

```bash
# 服务器日志示例
📊 AI Token Usage Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endpoint: extract-recipe
Model: gpt-4o-mini
URL: https://www.recipetineats.com/chicken-chasseur/
Recipe: Chicken Chasseur
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tokens:
  • Prompt: 2,456 tokens
  • Completion: 1,234 tokens
  • Total: 3,690 tokens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cost: $0.002734 (2.734 cents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 [extract-recipe] 3,690 tokens (2,456 + 1,234) = $0.002734
```

## 成本监控

### 每日成本估算

基于token使用日志，可以估算每日/每月成本：

```javascript
// 示例：计算每日成本
const dailyCost = totalTokens * costPerToken;
console.log(`Estimated daily cost: $${dailyCost.toFixed(2)}`);
```

### 成本优化建议

1. **使用合适的模型**
   - 简单任务使用 `gpt-4o-mini`（最便宜）
   - 复杂任务使用 `gpt-4o`（更准确但更贵）

2. **优化Prompt**
   - 减少不必要的上下文
   - 使用更简洁的指令
   - 限制输出长度

3. **缓存结果**
   - 缓存常见查询结果
   - 避免重复调用相同内容

4. **批量处理**
   - 批量处理相似请求
   - 减少API调用次数

## 扩展功能（可选）

### 1. 数据库存储

可以将token使用记录存储到数据库：

```javascript
// 存储到 Supabase
await supabase.from('ai_usage_logs').insert({
  endpoint: 'extract-recipe',
  model: 'gpt-4o-mini',
  prompt_tokens: 1234,
  completion_tokens: 567,
  total_tokens: 1801,
  cost: 0.001234,
  user_id: userId,
  created_at: new Date().toISOString(),
});
```

### 2. 成本统计API

创建API端点查看成本统计：

```javascript
app.get('/api/ai-usage-stats', async (req, res) => {
  // 查询数据库获取统计信息
  const stats = await getUsageStats();
  res.json(stats);
});
```

### 3. 成本预警

设置成本预警阈值：

```javascript
if (dailyCost > COST_THRESHOLD) {
  console.warn(`⚠️  Daily cost exceeded threshold: $${dailyCost}`);
  // 发送通知
}
```

## 文件结构

```
server/
├── server.js           # 主服务器文件（已添加日志调用）
├── aiTokenLogger.js    # Token日志模块（新建）
└── AI_TOKEN_LOGGING.md # 本文档
```

## 注意事项

1. **定价更新**: OpenAI可能更新定价，需要同步更新 `PRICING` 常量
2. **精度**: 成本计算基于当前定价，实际成本可能略有不同
3. **日志存储**: 当前日志仅输出到控制台，如需持久化需要添加数据库存储

## 更新定价

如果OpenAI更新了定价，请更新 `aiTokenLogger.js` 中的 `PRICING` 对象：

```javascript
const PRICING = {
  'gpt-4o-mini': {
    input: 0.15,   // 更新为新价格
    output: 0.60,  // 更新为新价格
  },
  // ...
};
```

---

**最后更新：** 2025-01-XX
**状态：** 已实现 ✅

