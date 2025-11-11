# YouTube API 查询详情和配额消耗说明

## 为什么每次查询需要 100 units？

### YouTube Data API v3 配额规则

根据 YouTube Data API v3 的官方文档，不同的 API 操作消耗不同数量的配额单位（quota units）：

- **search.list** (搜索操作): **100 units**
- **videos.list** (获取视频详情): **1 unit**
- **channels.list** (获取频道信息): **1 unit**
- **playlists.list** (获取播放列表): **1 unit**

**我们的代码使用的是 `search.list` 操作**，这是 YouTube API 中消耗配额最多的操作之一，因为搜索需要大量的服务器资源来处理和排序结果。

## 每次查询都查询了什么内容？

### 1. API 端点调用

**端点**: `https://www.googleapis.com/youtube/v3/search`

**HTTP 方法**: `GET`

**请求参数**:
```javascript
{
  part: 'snippet',              // 请求的视频片段信息
  q: searchQuery,               // 搜索查询字符串
  type: 'video',                // 只搜索视频（不包括频道、播放列表等）
  maxResults: 1,                // 只获取第一个（最相关的）结果
  key: process.env.YOUTUBE_API_KEY,
  videoEmbeddable: true,        // 只返回可嵌入的视频
  order: 'relevance',           // 按相关性排序
  safeSearch: 'moderate'        // 中等安全搜索（过滤不当内容）
}
```

### 2. 返回的数据内容

每次 `search.list` API 调用返回以下信息：

```javascript
{
  videoId: item.id.videoId,                    // 视频ID
  title: item.snippet.title,                   // 视频标题
  description: item.snippet.description,       // 视频描述
  thumbnail: item.snippet.thumbnails.high?.url, // 视频缩略图（高清）
  channelTitle: item.snippet.channelTitle,     // 频道名称
  publishedAt: item.snippet.publishedAt,       // 发布时间
  url: `https://www.youtube.com/watch?v=...`,  // 视频URL
  embedUrl: `https://www.youtube.com/embed/...` // 嵌入URL
}
```

### 3. 完整的查询流程

#### 步骤 1: AI 生成搜索查询（不消耗 YouTube 配额）
- 使用 OpenAI 生成 2 个优化的搜索查询
- 消耗: **0 YouTube units** (只消耗 OpenAI tokens)

#### 步骤 2: 对每个搜索查询调用 YouTube API
- 对每个搜索查询调用 `search.list`
- 每次调用消耗: **100 units**
- 获取: 最相关的视频的详细信息

#### 步骤 3: 处理返回的数据
- 合并 AI 生成的描述和 YouTube API 返回的数据
- 去重（基于 videoId）
- 返回最多 3 个视频

## 配额消耗详细计算

### 当前实现（优化后）

**每个食谱选项**:
1. AI 生成 2 个搜索查询 (0 YouTube units)
2. 调用 2 次 `search.list` API
   - 每次: 100 units
   - 总计: 2 × 100 = **200 units**

**每次用户查询（3 个食谱选项）**:
- 食谱选项 1: 200 units
- 食谱选项 2: 200 units
- 食谱选项 3: 200 units
- **总计: 3 × 200 = 600 units**

### 优化前（未优化）

**每个食谱选项**:
- 3 个搜索查询 × 100 units = **300 units**

**每次用户查询（3 个食谱选项）**:
- 3 × 300 = **900 units**

## 为什么 search.list 消耗 100 units？

### 技术原因

1. **服务器资源密集**: 搜索操作需要 YouTube 服务器：
   - 索引搜索
   - 相关性排序
   - 内容过滤
   - 结果排序

2. **数据量大**: 搜索可能涉及数百万个视频
   - 需要处理大量数据
   - 需要复杂的算法来排序
   - 需要过滤和筛选结果

3. **实时性要求**: 搜索结果需要实时更新
   - 新上传的视频
   - 观看次数变化
   - 相关性算法更新

### 对比其他操作

- **videos.list**: 1 unit（直接通过 ID 获取，不需要搜索）
- **channels.list**: 1 unit（直接获取频道信息）
- **search.list**: 100 units（需要搜索和排序）

## 查询内容详解

### 1. 搜索查询参数

```javascript
part: 'snippet'
```
- 请求视频的片段信息（snippet）
- 包括：标题、描述、缩略图、频道、发布时间等
- 不包括：视频文件、字幕、评论等

```javascript
q: searchQuery
```
- 搜索查询字符串
- 例如: "air fryer chicken recipe"
- YouTube 会根据这个查询字符串搜索相关视频

```javascript
type: 'video'
```
- 只搜索视频类型
- 不包括：频道、播放列表、直播等

```javascript
maxResults: 1
```
- 只返回 1 个结果（最相关的）
- 这样可以减少数据传输和处理时间

```javascript
order: 'relevance'
```
- 按相关性排序
- YouTube 的算法会根据查询字符串的相关性排序结果

```javascript
safeSearch: 'moderate'
```
- 中等安全搜索
- 过滤掉不当内容
- 确保返回的视频适合家庭观看

```javascript
videoEmbeddable: true
```
- 只返回可以嵌入的视频
- 某些视频可能不允许嵌入

### 2. 返回的数据字段

#### videoId
- 视频的唯一标识符
- 用于构建视频 URL 和嵌入 URL

#### title
- 视频标题
- 显示在搜索结果中

#### description
- 视频描述
- 可能很长，包含视频的详细信息

#### thumbnail
- 视频缩略图 URL
- 使用高清版本（high quality）
- 如果不可用，使用中等或默认版本

#### channelTitle
- 上传视频的频道名称
- 用于显示视频来源

#### publishedAt
- 视频发布时间
- ISO 8601 格式

#### url
- 视频观看 URL
- 格式: `https://www.youtube.com/watch?v={videoId}`

#### embedUrl
- 视频嵌入 URL
- 格式: `https://www.youtube.com/embed/{videoId}`
- 用于在网页中嵌入视频

## 优化建议

### 1. 使用缓存（已实现）✅
- 缓存搜索结果 24 小时
- 相同的食谱查询直接返回缓存结果
- 节省: 100% 的重复查询配额

### 2. 减少搜索查询数量（已实现）✅
- 从 3 个减少到 2 个
- 节省: 33% 的配额消耗

### 3. 使用 videos.list 获取详细信息（可选）
- 如果只需要视频详情，使用 `videos.list`
- 消耗: 1 unit（比 search.list 少 99 units）
- 但需要先知道视频 ID

### 4. 批量搜索（不可行）
- YouTube API 不支持批量搜索
- 每个搜索查询需要单独的 API 调用

### 5. 使用 YouTube IFrame API（不适用）
- IFrame API 不提供搜索功能
- 只能嵌入已知的视频

## 配额消耗对比

### 不同操作的配额消耗

| 操作 | 配额消耗 | 用途 |
|------|---------|------|
| search.list | 100 units | 搜索视频 |
| videos.list | 1 unit | 获取视频详情 |
| channels.list | 1 unit | 获取频道信息 |
| playlists.list | 1 unit | 获取播放列表 |

### 我们的使用情况

| 步骤 | 操作 | 配额消耗 | 说明 |
|------|------|---------|------|
| 1. AI 生成查询 | OpenAI API | 0 YouTube units | 不消耗 YouTube 配额 |
| 2. 搜索视频 | search.list | 100 units/次 | 每个搜索查询 |
| 3. 处理数据 | 本地处理 | 0 units | 不消耗配额 |

## 总结

### 为什么是 100 units？

1. **search.list 是资源密集操作**: 需要搜索、排序、过滤大量数据
2. **YouTube API 的定价策略**: 搜索操作消耗更多配额
3. **实时性要求**: 搜索结果需要实时更新

### 每次查询获取什么？

1. **视频基本信息**: ID、标题、描述
2. **视觉内容**: 缩略图 URL
3. **元数据**: 频道、发布时间
4. **链接**: 观看 URL、嵌入 URL

### 如何优化？

1. ✅ **缓存机制**: 减少重复查询
2. ✅ **减少查询数量**: 从 3 个减少到 2 个
3. ⚠️ **使用 videos.list**: 如果已知视频 ID（不适用，因为我们不知道 ID）
4. ⚠️ **减少 maxResults**: 已经是 1（最小）

### 当前配额消耗

- **每次用户查询**: 600 units（优化后）
- **每日配额**: 10,000 units
- **每日可用查询**: 约 16 次
- **缓存命中**: 0 units（完全免费）

通过缓存机制，实际配额消耗会更少，因为相同的食谱查询会直接使用缓存结果，不需要再次调用 API。

