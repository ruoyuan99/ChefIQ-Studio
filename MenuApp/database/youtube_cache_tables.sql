-- YouTube 本地智库数据库表
-- 用于存储YouTube查询结果，减少API调用，提供备用查询方案

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 用于文本相似度匹配

-- ============================================
-- 表1: youtube_queries (查询记录表)
-- 存储每次查询的元数据
-- ============================================
CREATE TABLE IF NOT EXISTS youtube_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,                    -- 原始查询关键词
  normalized_query TEXT NOT NULL,               -- 规范化后的查询（小写、去空格，用于匹配）
  query_hash TEXT UNIQUE NOT NULL,              -- 查询的hash值（用于精确匹配和去重）
  recipe_title TEXT,                            -- 关联的菜谱标题（可选，用于上下文）
  cookware TEXT,                                -- 关联的厨具（可选，用于上下文）
  total_results INTEGER DEFAULT 0,              -- 本次查询获取的结果数
  api_quota_used INTEGER DEFAULT 100,           -- 使用的API配额（units，search.list = 100 units）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,        -- 最后使用时间（用于清理过期数据）
  use_count INTEGER DEFAULT 0,                  -- 使用次数（统计复用率）
  is_active BOOLEAN DEFAULT true                 -- 查询是否仍然有效
);

-- ============================================
-- 表2: youtube_videos (视频详情表)
-- 存储具体的视频信息
-- ============================================
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES youtube_queries(id) ON DELETE CASCADE,
  video_id TEXT UNIQUE NOT NULL,                -- YouTube video ID（唯一标识）
  title TEXT NOT NULL,
  description TEXT,                              -- 视频描述（可能很长，考虑压缩）
  thumbnail_url TEXT,
  channel_title TEXT,
  channel_id TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration TEXT,                                -- 视频时长（ISO 8601格式，如PT10M30S）
  view_count BIGINT,                            -- 观看次数
  like_count BIGINT,                            -- 点赞数
  url TEXT NOT NULL,                            -- https://www.youtube.com/watch?v=...
  embed_url TEXT NOT NULL,                      -- https://www.youtube.com/embed/...
  relevance_score FLOAT DEFAULT 1.0,            -- 相关性评分（用于排序，1.0 = 完全匹配）
  is_active BOOLEAN DEFAULT true,               -- 视频是否仍然有效（可能被删除）
  last_verified_at TIMESTAMP WITH TIME ZONE,    -- 最后验证时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 表3: youtube_query_keywords (查询关键词表)
-- 用于关键词匹配和搜索
-- ============================================
CREATE TABLE IF NOT EXISTS youtube_query_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES youtube_queries(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,                        -- 提取的关键词（单个词）
  weight FLOAT DEFAULT 1.0,                    -- 关键词权重（用于相似度计算）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 索引创建（提高查询性能）
-- ============================================

-- youtube_queries 表索引
CREATE INDEX IF NOT EXISTS idx_youtube_queries_query_hash ON youtube_queries(query_hash);
CREATE INDEX IF NOT EXISTS idx_youtube_queries_normalized_query ON youtube_queries(normalized_query);
CREATE INDEX IF NOT EXISTS idx_youtube_queries_last_used_at ON youtube_queries(last_used_at);
CREATE INDEX IF NOT EXISTS idx_youtube_queries_is_active ON youtube_queries(is_active);
CREATE INDEX IF NOT EXISTS idx_youtube_queries_created_at ON youtube_queries(created_at);

-- youtube_videos 表索引
CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON youtube_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_query_id ON youtube_videos(query_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_relevance_score ON youtube_videos(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_is_active ON youtube_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel_id ON youtube_videos(channel_id);

-- youtube_query_keywords 表索引
CREATE INDEX IF NOT EXISTS idx_youtube_query_keywords_keyword ON youtube_query_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_youtube_query_keywords_query_id ON youtube_query_keywords(query_id);
CREATE INDEX IF NOT EXISTS idx_youtube_query_keywords_keyword_trgm ON youtube_query_keywords USING gin(keyword gin_trgm_ops); -- 全文搜索索引

-- ============================================
-- 辅助函数
-- ============================================

-- 规范化查询字符串（用于匹配）
CREATE OR REPLACE FUNCTION normalize_query(query_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 转换为小写，去除多余空格，去除特殊字符
  RETURN lower(trim(regexp_replace(query_text, '[^\w\s]', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 计算查询hash（用于精确匹配）
CREATE OR REPLACE FUNCTION hash_query(query_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(normalize_query(query_text), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 更新查询使用统计
CREATE OR REPLACE FUNCTION update_query_usage(query_hash_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE youtube_queries 
  SET 
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE query_hash = query_hash_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 触发器：自动更新查询使用时间
-- ============================================
CREATE OR REPLACE FUNCTION update_youtube_query_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE youtube_queries 
  SET last_used_at = NOW(), use_count = use_count + 1
  WHERE id = NEW.query_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 当视频被查询时，更新关联查询的使用时间
-- 注意：这需要在应用层实现，因为查询操作不直接触发此触发器

-- ============================================
-- 清理过期数据的函数（定期执行）
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_youtube_queries(days_old INTEGER DEFAULT 180)
RETURNS TABLE(deleted_queries INTEGER, deleted_videos INTEGER) AS $$
DECLARE
  query_ids UUID[];
  deleted_q INTEGER;
  deleted_v INTEGER;
BEGIN
  -- 查找6个月未使用且使用次数为0的查询
  SELECT ARRAY_AGG(id) INTO query_ids
  FROM youtube_queries
  WHERE 
    last_used_at < NOW() - (days_old || ' days')::INTERVAL
    AND use_count = 0
    AND is_active = true;
  
  -- 删除关联的视频
  DELETE FROM youtube_videos
  WHERE query_id = ANY(query_ids);
  GET DIAGNOSTICS deleted_v = ROW_COUNT;
  
  -- 删除查询记录
  DELETE FROM youtube_queries
  WHERE id = ANY(query_ids);
  GET DIAGNOSTICS deleted_q = ROW_COUNT;
  
  RETURN QUERY SELECT deleted_q, deleted_v;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 行级安全策略（RLS）
-- ============================================
ALTER TABLE youtube_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_query_keywords ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取（因为这是公共数据）
CREATE POLICY "Allow public read access to youtube_queries" ON youtube_queries
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to youtube_videos" ON youtube_videos
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to youtube_query_keywords" ON youtube_query_keywords
  FOR SELECT USING (true);

-- 允许所有用户写入（用于缓存功能）
-- 注意：如果担心安全问题，可以限制为 authenticated users 或使用 service_role key
CREATE POLICY "Allow public insert to youtube_queries" ON youtube_queries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to youtube_queries" ON youtube_queries
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert to youtube_videos" ON youtube_videos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to youtube_videos" ON youtube_videos
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to youtube_videos" ON youtube_videos
  FOR DELETE USING (true);

CREATE POLICY "Allow public insert to youtube_query_keywords" ON youtube_query_keywords
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete to youtube_query_keywords" ON youtube_query_keywords
  FOR DELETE USING (true);

-- ============================================
-- 示例查询：查找相似查询
-- ============================================
-- 查找与给定查询相似的历史查询（关键词匹配）
-- SELECT DISTINCT q.*, 
--   similarity(q.normalized_query, normalize_query('chicken stir fry')) as similarity_score
-- FROM youtube_queries q
-- WHERE similarity(q.normalized_query, normalize_query('chicken stir fry')) > 0.3
-- ORDER BY similarity_score DESC
-- LIMIT 10;

