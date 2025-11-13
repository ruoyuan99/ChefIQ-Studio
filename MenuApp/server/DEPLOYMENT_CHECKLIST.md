# YouTube Cache 部署检查清单

## 当前状态

### ✅ 已完成
- [x] 代码实现完成（server.js 已更新）
- [x] 依赖已添加（@supabase/supabase-js 在 package.json 中）
- [x] 数据库表已创建（youtube_cache_tables.sql）
- [x] 测试脚本已创建（test-youtube-cache.js）
- [x] 本地测试通过

### ⚠️ 需要检查

## Railway 部署检查

### 1. 环境变量配置

在 Railway 项目设置中，确保以下环境变量已设置：

#### 必需的环境变量：
```bash
# Supabase 配置（用于 YouTube 缓存）
EXPO_PUBLIC_SUPABASE_URL=https://txendredncvrbxnxphbm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZW5kcmVkbmN2cmJ4bnhwaGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3OTAsImV4cCI6MjA3NzI1ODc5MH0.EH6kk2dmx80Vm0-OsXAYZeU9vu_JZ0ElNh1WHEHzFfM

# 现有环境变量（应该已经设置）
OPENAI_API_KEY=your_openai_key
YOUTUBE_API_KEY=your_youtube_key
PORT=3001
```

### 2. 检查步骤

#### 步骤 1: 登录 Railway Dashboard
1. 访问 https://railway.app
2. 登录您的账户
3. 找到 "Chef iQ Studio" 项目

#### 步骤 2: 检查环境变量
1. 进入项目设置（Settings）
2. 找到 "Variables" 或 "Environment Variables"
3. 确认以下变量存在：
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `YOUTUBE_API_KEY`

#### 步骤 3: 添加缺失的环境变量
如果 `EXPO_PUBLIC_SUPABASE_URL` 或 `EXPO_PUBLIC_SUPABASE_ANON_KEY` 不存在：
1. 点击 "New Variable"
2. 添加变量名和值（使用上面的值）
3. 保存

#### 步骤 4: 重新部署
1. 进入 "Deployments" 标签
2. 点击 "Redeploy" 或触发新的部署
3. 等待部署完成

### 3. 验证部署

部署完成后，检查服务器日志：

#### 在 Railway Dashboard 中：
1. 进入 "Deployments"
2. 点击最新的部署
3. 查看 "Logs"

#### 应该看到的日志：
```
✅ OpenAI API initialized
✅ Supabase client initialized for YouTube cache  ← 这个很重要！
🚀 Recipe Import Server running on port 3001
```

#### 如果看到这个，说明环境变量未设置：
```
⚠️  Supabase credentials not found. YouTube cache will be disabled.
   Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file to enable caching.
```

### 4. 测试缓存功能

部署成功后，测试缓存功能：

1. **第一次查询**（应该调用 API 并存储）：
   - 生成一个菜谱
   - 查看日志，应该看到：
     ```
     🔍 Searching YouTube API for: "..." (maxResults: 50)
     💾 Stored X YouTube videos for query: "..."
     ```

2. **第二次查询相同内容**（应该使用缓存）：
   - 再次生成相同的菜谱
   - 查看日志，应该看到：
     ```
     💾 Found cached YouTube query: "..." (X videos)
     ```
   - **不应该**看到 `🔍 Searching YouTube API for`

## 故障排除

### 问题 1: 没有 Supabase 初始化日志

**原因**：环境变量未设置或部署未更新

**解决方案**：
1. 检查 Railway 环境变量
2. 确保变量名正确（大小写敏感）
3. 重新部署服务器

### 问题 2: 缓存未工作

**原因**：可能是以下之一：
- 数据库表未创建
- RLS 策略未设置
- 环境变量未正确传递

**解决方案**：
1. 确认已在 Supabase 中执行 `youtube_cache_tables.sql`
2. 确认 RLS 策略已设置（执行 `youtube_cache_rls_fix.sql` 如果需要）
3. 检查 Railway 日志中的错误信息

### 问题 3: 部署后代码未更新

**原因**：Railway 可能使用了缓存的构建

**解决方案**：
1. 在 Railway 中清除构建缓存
2. 或触发新的部署（推送代码到 GitHub）

## 快速检查命令

如果您有 Railway CLI 访问权限：

```bash
# 检查环境变量
railway variables

# 查看日志
railway logs

# 重新部署
railway up
```

## 下一步

部署成功后：
1. ✅ 监控缓存命中率
2. ✅ 检查 API 配额使用是否减少
3. ✅ 准备阶段2（相似度匹配）

