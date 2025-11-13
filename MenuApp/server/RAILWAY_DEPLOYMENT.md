# Railway 部署指南 - YouTube Cache

## 快速检查清单

### ✅ 1. 环境变量检查

在 Railway Dashboard 中，确保以下环境变量已设置：

```bash
# Supabase（用于 YouTube 缓存）
EXPO_PUBLIC_SUPABASE_URL=https://txendredncvrbxnxphbm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZW5kcmVkbmN2cmJ4bnhwaGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3OTAsImV4cCI6MjA3NzI1ODc5MH0.EH6kk2dmx80Vm0-OsXAYZeU9vu_JZ0ElNh1WHEHzFfM

# 现有变量（应该已经存在）
OPENAI_API_KEY=...
YOUTUBE_API_KEY=...
PORT=3001
```

### ✅ 2. 部署步骤

1. **登录 Railway Dashboard**
   - 访问 https://railway.app
   - 进入您的项目

2. **检查环境变量**
   - Settings → Variables
   - 确认 `EXPO_PUBLIC_SUPABASE_URL` 和 `EXPO_PUBLIC_SUPABASE_ANON_KEY` 存在

3. **添加缺失的变量**（如果需要）
   - 点击 "New Variable"
   - 添加变量名和值
   - 保存

4. **重新部署**
   - Deployments → 点击 "Redeploy" 或触发新部署
   - 等待部署完成

### ✅ 3. 验证部署

部署完成后，检查日志中是否有：

```
✅ Supabase client initialized for YouTube cache
```

**如果没有看到这个日志**，说明环境变量未设置或未正确传递。

### ✅ 4. 测试缓存

1. **第一次查询**（会调用 API）：
   - 生成一个菜谱
   - 日志应该显示：`🔍 Searching YouTube API for: ...`
   - 然后显示：`💾 Stored X YouTube videos`

2. **第二次查询相同内容**（应该使用缓存）：
   - 再次生成相同菜谱
   - 日志应该显示：`💾 Found cached YouTube query: ...`
   - **不应该**看到 `🔍 Searching YouTube API for`

## 常见问题

### Q: 为什么没有看到 Supabase 初始化日志？

**A**: 环境变量可能未设置。检查 Railway 环境变量设置。

### Q: 缓存不工作怎么办？

**A**: 
1. 确认数据库表已创建（执行 `youtube_cache_tables.sql`）
2. 确认 RLS 策略已设置
3. 检查 Railway 日志中的错误信息

### Q: 如何确认代码已更新？

**A**: 
- 检查 `package.json` 中是否有 `@supabase/supabase-js`
- 检查服务器日志中的初始化消息
- 查看部署时间戳

## 需要帮助？

如果遇到问题，检查：
1. Railway 部署日志
2. Supabase 数据库表是否存在
3. 环境变量是否正确设置

