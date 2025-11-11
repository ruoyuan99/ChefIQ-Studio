# YouTube API 配额问题诊断和解决方案

## 问题诊断

### 发现的问题
- **错误代码**: 403
- **错误信息**: "quotaExceeded" - YouTube API配额已用尽
- **症状**: 没有视频结果返回，只有searchUrl

### 原因分析
1. **两阶段优化增加了API调用次数**:
   - 之前: 3个recipes × 3个搜索查询 = 9个YouTube API调用
   - 现在: 仍然是9个调用（每个recipe生成3个搜索查询）
   - 但可能由于测试或使用频率高，配额已用尽

2. **YouTube API配额限制**:
   - 默认配额: 10,000 units per day
   - 每次搜索请求: 100 units
   - 9个调用 = 900 units per recipe generation
   - 可以生成约11次食谱（10,000 / 900 ≈ 11）

3. **配额重置时间**:
   - 通常在太平洋时间午夜（PST/PDT）重置
   - 或者根据Google Cloud Console的设置

## 解决方案

### 1. 立即解决方案

#### 方案A: 等待配额重置
- 等待到配额重置时间（通常是午夜）
- 配额会自动恢复

#### 方案B: 申请增加配额
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目
3. 导航到 "APIs & Services" > "Quotas"
4. 找到 "YouTube Data API v3"
5. 申请增加配额

#### 方案C: 优化API调用（推荐）
- 实现缓存机制，避免重复搜索
- 减少每个recipe的搜索查询数量（从3个减少到1-2个）
- 只在必要时调用API

### 2. 代码优化

#### 优化1: 添加缓存机制
```javascript
// 缓存搜索结果
const youtubeCache = new Map();

// 在搜索前检查缓存
const cacheKey = `${recipeTitle}-${cookware}`;
if (youtubeCache.has(cacheKey)) {
  return youtubeCache.get(cacheKey);
}
```

#### 优化2: 减少搜索查询数量
- 从每个recipe 3个搜索查询减少到1-2个
- 或者只对第一个recipe进行详细搜索

#### 优化3: 添加配额检测
- 检测403错误
- 如果配额用尽，直接返回searchUrl，不进行API调用
- 提供友好的错误提示

### 3. 临时解决方案

#### 方案A: 禁用YouTube视频搜索
- 设置环境变量跳过YouTube API调用
- 只返回searchUrl

#### 方案B: 使用备用API key
- 如果有多个API key，可以轮换使用
- 注意：需要遵守YouTube API的使用条款

## 当前状态

### API调用流程
1. **Stage 1**: 生成3个recipe构想（使用OpenAI）
2. **Stage 2**: 生成3个详细recipes（使用OpenAI）
3. **YouTube搜索**: 对每个recipe进行YouTube搜索
   - 每个recipe: 3个AI优化的搜索查询
   - 每个搜索查询: 1个YouTube API调用
   - 总计: 3 recipes × 3 queries = 9个API调用

### 配额使用
- **每次食谱生成**: 9个API调用 = 900 units
- **每日配额**: 10,000 units
- **可用次数**: 约11次食谱生成

## 推荐的优化方案

### 1. 实现缓存（最有效）
- 缓存相同recipe的搜索结果
- 减少重复API调用
- 可以大幅降低配额使用

### 2. 减少搜索查询数量
- 从3个查询减少到1-2个
- 仍然可以获得视频，但减少配额使用

### 3. 添加配额检测和错误处理
- 检测403错误
- 提供友好的错误提示
- 自动fallback到searchUrl

### 4. 优化调用时机
- 只在用户明确需要视频时才搜索
- 延迟搜索（lazy loading）
- 批量搜索

## 检查配额使用情况

### 方法1: Google Cloud Console
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目
3. 导航到 "APIs & Services" > "Dashboard"
4. 查看 "YouTube Data API v3" 的使用情况

### 方法2: API响应头
- 检查API响应的headers
- 查看 `X-RateLimit-*` headers（如果有）

### 方法3: 服务器日志
- 检查服务器日志中的错误信息
- 查找403错误和配额相关消息

## 临时解决方案

如果需要立即恢复功能，可以：

1. **等待配额重置**: 通常在太平洋时间午夜
2. **申请增加配额**: 在Google Cloud Console申请
3. **优化代码**: 实现缓存和减少调用
4. **使用备用方案**: 只返回searchUrl，不调用API

## 长期解决方案

1. **实现缓存机制**: 避免重复搜索
2. **优化搜索策略**: 减少不必要的API调用
3. **监控配额使用**: 跟踪API使用情况
4. **申请更高配额**: 如果需要更多调用
5. **实现降级策略**: 当配额用尽时，优雅降级

## 代码改进

已经添加了：
1. ✅ 更好的错误处理（检测403错误）
2. ✅ 详细的错误日志
3. ✅ 配额用尽提示
4. ✅ 友好的错误消息

计划添加：
- [ ] 缓存机制
- [ ] 配额检测
- [ ] 自动降级
- [ ] 配额使用监控

