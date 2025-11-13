# YouTube Cache 测试说明

## 前置条件

### 1. 创建数据库表

在运行测试之前，您需要在 Supabase 数据库中创建表结构：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 打开文件 `MenuApp/database/youtube_cache_tables.sql`
5. 复制所有 SQL 语句并执行

### 2. 配置环境变量（可选）

如果您想使用自定义的 Supabase 凭证，请在 `MenuApp/server/.env` 文件中添加：

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**注意**：如果不配置，测试脚本会使用前端代码中的默认值。

## 运行测试

### 基本测试（保留测试数据）

```bash
cd MenuApp/server
npm run test:cache
```

### 完整测试（包含清理）

```bash
cd MenuApp/server
npm run test:cache:cleanup
```

## 测试内容

测试脚本会执行以下测试：

1. **数据库连接测试**
   - 验证 Supabase 连接
   - 检查表是否存在

2. **存储查询测试**
   - 测试存储 YouTube 查询到数据库
   - 测试存储视频信息
   - 测试存储关键词

3. **查找缓存查询测试**
   - 测试精确匹配查询
   - 验证使用统计更新

4. **查询规范化测试**
   - 测试不同格式的查询是否产生相同的哈希
   - 验证查询规范化功能

5. **清理测试数据**（可选）
   - 删除测试过程中创建的数据

## 预期结果

如果所有测试通过，您应该看到：

```
🎉 All tests passed! Stage 1 implementation is working correctly.
```

## 故障排除

### 错误：Table does not exist

**解决方案**：请确保已执行 `youtube_cache_tables.sql` 中的所有 SQL 语句。

### 错误：Permission denied

**解决方案**：检查 Supabase RLS (Row Level Security) 策略。确保：
- 允许匿名用户读取表（SELECT）
- 允许服务端写入（INSERT/UPDATE/DELETE）

如果使用 anon key，可能需要调整 RLS 策略或使用 service_role key。

### 错误：Connection timeout

**解决方案**：
- 检查网络连接
- 验证 Supabase URL 是否正确
- 检查防火墙设置

## 下一步

测试通过后，您可以：

1. 启动服务器：`npm start`
2. 测试实际的 YouTube 查询功能
3. 查看服务器日志中的缓存命中情况

