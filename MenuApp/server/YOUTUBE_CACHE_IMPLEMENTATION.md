# YouTube 本地智库实现方案

## 📋 实施步骤

### 阶段1: 数据库准备 ✅

1. **执行SQL脚本**
   ```bash
   # 在Supabase Dashboard的SQL Editor中执行
   # 文件：database/youtube_cache_tables.sql
   ```

2. **验证表创建**
   - 检查3个表是否创建成功
   - 验证索引是否创建
   - 测试基本查询

### 阶段2: 修改YouTube查询函数

#### 2.1 修改 `searchYouTubeVideosByQuery`
- 将 `maxResults` 从 1-3 改为 50
- 添加数据库存储逻辑

#### 2.2 创建存储函数
- `storeYouTubeQuery(query, videos)` - 存储查询和视频
- `findCachedQuery(query)` - 查找缓存
- `findSimilarQueries(query)` - 查找相似查询

#### 2.3 修改查询流程
- 优先查询本地智库
- 未找到时调用YouTube API
- 存储新查询结果

### 阶段3: 智能匹配算法

#### 3.1 关键词提取
- 从查询字符串提取关键词
- 去除停用词（the, a, an, etc.）
- 计算关键词权重

#### 3.2 相似度计算
- 使用PostgreSQL `pg_trgm` 扩展
- 计算文本相似度
- 关键词重叠度

### 阶段4: Token用尽时的降级策略

- 检测 `QUOTA_EXCEEDED` 错误
- 自动切换到本地智库模式
- 使用模糊匹配返回结果

---

## 🔧 代码修改点

### 1. `searchYouTubeVideosByQuery` 函数
```javascript
// 修改前：maxResults = 1-3
// 修改后：maxResults = 50
async function searchYouTubeVideosByQuery(searchQuery, maxResults = 50) {
  // 1. 先检查本地智库
  const cached = await findCachedYouTubeQuery(searchQuery);
  if (cached) {
    return cached.videos;
  }
  
  // 2. 调用YouTube API
  const videos = await callYouTubeAPI(searchQuery, maxResults);
  
  // 3. 存储到数据库
  await storeYouTubeQuery(searchQuery, videos);
  
  return videos;
}
```

### 2. 新增函数：`findCachedYouTubeQuery`
```javascript
async function findCachedYouTubeQuery(searchQuery) {
  // 1. 精确匹配（使用hash）
  const exactMatch = await findExactQuery(searchQuery);
  if (exactMatch) return exactMatch;
  
  // 2. 相似匹配（关键词匹配）
  const similarMatch = await findSimilarQuery(searchQuery);
  if (similarMatch) return similarMatch;
  
  return null;
}
```

### 3. 新增函数：`storeYouTubeQuery`
```javascript
async function storeYouTubeQuery(searchQuery, videos, recipeContext = null) {
  // 1. 创建查询记录
  // 2. 存储视频（去重）
  // 3. 提取并存储关键词
}
```

---

## 📊 预期效果

### Token使用对比

**当前方案**：
- 每次查询：100 units（1个结果）
- 10次查询：1000 units
- 50次查询：5000 units

**优化方案**：
- 首次查询：100 units（50个结果）
- 后续9次：0 units（使用缓存）
- 10次查询：100 units（节省90%）
- 50次查询：500 units（节省90%）

### 响应时间对比

- **YouTube API**：500-2000ms
- **本地数据库**：10-50ms
- **提升**：10-200倍

---

## ⚠️ 注意事项

1. **数据一致性**：确保video_id唯一性
2. **存储空间**：定期清理过期数据
3. **匹配精度**：相似度阈值需要调优
4. **API限制**：即使有缓存，也要遵守YouTube条款

---

## 🚀 快速开始

1. 执行 `database/youtube_cache_tables.sql`
2. 修改 `server.js` 中的相关函数
3. 测试查询和存储逻辑
4. 监控token使用情况

