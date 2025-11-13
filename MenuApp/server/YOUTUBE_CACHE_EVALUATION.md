# YouTube 本地智库方案评估

## 📊 方案概述

**目标**：创建本地YouTube视频智库，减少API调用，在token用尽时提供备用方案

**核心功能**：
1. 每次YouTube查询获取50个结果（而非当前的1-3个）
2. 将查询结果存储到Supabase数据库
3. 实现智能查询匹配，优先使用本地数据
4. 当YouTube API token用尽时，完全依赖本地智库

---

## ✅ 方案优势

### 1. **Token节省**
- **当前**：每次查询1-3个结果，消耗100 units/query
- **优化后**：一次查询50个结果，存储后重复使用
- **节省比例**：假设50个结果可服务10-20次查询，节省率可达80-90%

### 2. **响应速度**
- 本地数据库查询：~10-50ms
- YouTube API查询：~500-2000ms
- **提升**：10-200倍速度提升

### 3. **可靠性**
- YouTube API不可用时仍可提供服务
- 减少对第三方服务的依赖
- 提高用户体验稳定性

### 4. **数据积累**
- 历史查询数据可复用
- 支持相似查询的智能匹配
- 建立自己的视频推荐库

---

## ⚠️ 潜在挑战

### 1. **存储空间**
- 50个结果/查询 × 平均查询频率
- 每个视频记录约500-1000 bytes
- **估算**：1000次查询 ≈ 25-50MB（可接受）

### 2. **数据新鲜度**
- YouTube视频可能被删除/下架
- 新视频无法及时获取
- **解决方案**：定期刷新机制 + 过期标记

### 3. **查询匹配**
- 如何匹配相似查询？
- 关键词相似度算法
- **建议**：使用关键词提取 + 模糊匹配

### 4. **数据库性能**
- 大量数据时的查询性能
- 索引设计至关重要
- **建议**：关键词索引 + 全文搜索

---

## 🗄️ 数据库表设计

### 表1: `youtube_queries` (查询记录表)
存储每次查询的元数据

```sql
CREATE TABLE IF NOT EXISTS youtube_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,                    -- 原始查询关键词
  normalized_query TEXT NOT NULL,                 -- 规范化后的查询（用于匹配）
  recipe_title TEXT,                              -- 关联的菜谱标题（可选）
  cookware TEXT,                                  -- 关联的厨具（可选）
  query_hash TEXT UNIQUE NOT NULL,                -- 查询的hash值（用于去重）
  total_results INTEGER DEFAULT 0,                -- 本次查询获取的结果数
  api_quota_used INTEGER DEFAULT 100,              -- 使用的API配额（units）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,          -- 最后使用时间
  use_count INTEGER DEFAULT 0,                    -- 使用次数
  INDEX idx_normalized_query (normalized_query),
  INDEX idx_query_hash (query_hash),
  INDEX idx_last_used_at (last_used_at)
);
```

### 表2: `youtube_videos` (视频详情表)
存储具体的视频信息

```sql
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES youtube_queries(id) ON DELETE CASCADE,
  video_id TEXT UNIQUE NOT NULL,                  -- YouTube video ID
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  channel_title TEXT,
  channel_id TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration TEXT,                                  -- 视频时长
  view_count BIGINT,                              -- 观看次数
  like_count BIGINT,                              -- 点赞数
  url TEXT NOT NULL,                              -- https://www.youtube.com/watch?v=...
  embed_url TEXT NOT NULL,                        -- https://www.youtube.com/embed/...
  relevance_score FLOAT DEFAULT 1.0,              -- 相关性评分（用于排序）
  is_active BOOLEAN DEFAULT true,                 -- 视频是否仍然有效
  last_verified_at TIMESTAMP WITH TIME ZONE,      -- 最后验证时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_video_id (video_id),
  INDEX idx_query_id (query_id),
  INDEX idx_relevance_score (relevance_score),
  INDEX idx_is_active (is_active)
);
```

### 表3: `youtube_query_keywords` (查询关键词表)
用于关键词匹配和搜索

```sql
CREATE TABLE IF NOT EXISTS youtube_query_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES youtube_queries(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,                          -- 提取的关键词
  weight FLOAT DEFAULT 1.0,                      -- 关键词权重
  INDEX idx_keyword (keyword),
  INDEX idx_query_id (query_id)
);
```

---

## 🔍 查询匹配策略

### 策略1: 精确匹配（优先级最高）
- 使用 `query_hash` 进行精确匹配
- 如果找到，直接返回缓存结果

### 策略2: 关键词相似度匹配
- 提取查询关键词
- 计算与历史查询的关键词重叠度
- 返回相似度 > 70% 的查询结果

### 策略3: 语义匹配（可选，需要AI）
- 使用embedding向量计算语义相似度
- 适合更智能的匹配

---

## 📈 实现流程

### 1. 查询流程
```
用户请求 → 检查本地智库 → 
  ├─ 找到匹配 → 返回本地结果
  └─ 未找到 → YouTube API查询 → 存储到数据库 → 返回结果
```

### 2. 存储流程
```
YouTube API返回50个结果 → 
  ├─ 检查视频是否已存在（去重）
  ├─ 存储查询记录
  ├─ 存储视频详情
  └─ 提取并存储关键词
```

### 3. Token用尽时的降级策略
```
检测到QUOTA_EXCEEDED → 
  ├─ 标记全局flag
  ├─ 所有查询切换到本地智库
  └─ 使用模糊匹配返回最相关结果
```

---

## 💾 存储空间估算

### 单次查询存储
- 查询记录：~200 bytes
- 50个视频 × 800 bytes = 40KB
- 关键词：~1KB
- **总计**：~41KB/查询

### 1000次查询
- 约 41MB（可接受）

### 优化建议
- 定期清理过期/无效视频
- 压缩description字段（如果过长）
- 只存储必要的字段

---

## 🚀 实施建议

### 阶段1: 基础实现（推荐先做）
1. ✅ 创建数据库表
2. ✅ 修改 `searchYouTubeVideosByQuery` 获取50个结果
3. ✅ 实现存储逻辑
4. ✅ 实现精确匹配查询

### 阶段2: 智能匹配
1. 实现关键词提取
2. 实现相似度匹配算法
3. 优化查询性能（索引）

### 阶段3: 高级功能
1. 定期刷新机制
2. 视频有效性验证
3. 统计分析（热门查询、热门视频）

---

## ⚡ 性能优化建议

### 1. 索引策略
- `youtube_queries.query_hash` - 精确匹配
- `youtube_queries.normalized_query` - 模糊匹配
- `youtube_query_keywords.keyword` - 关键词搜索
- `youtube_videos.video_id` - 去重检查

### 2. 缓存策略
- 保留内存缓存（24小时TTL）
- 数据库作为长期存储
- 热点查询优先使用内存缓存

### 3. 查询优化
- 使用PostgreSQL全文搜索（tsvector）
- 关键词权重排序
- 限制返回结果数（最多返回前10-20个）

---

## 📝 注意事项

1. **数据一致性**：确保视频ID唯一性
2. **去重逻辑**：同一视频可能出现在多个查询中
3. **过期策略**：定期清理6个月未使用的查询
4. **隐私考虑**：查询记录可能包含用户信息
5. **API限制**：即使存储了，也要遵守YouTube使用条款

---

## 🎯 结论

**方案可行性**：✅ **高度可行**

**推荐实施**：✅ **强烈推荐**

**预期收益**：
- Token节省：80-90%
- 响应速度：提升10-200倍
- 可靠性：显著提升
- 成本：存储成本极低（Supabase免费额度充足）

**风险**：低（主要是存储空间，但完全可控）

