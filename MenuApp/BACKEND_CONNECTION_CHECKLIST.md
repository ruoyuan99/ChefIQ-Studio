# 后端连接检查清单

## ✅ 快速检查清单

### 开发环境

- [ ] 后端服务器正在运行 (`cd server && npm start`)
- [ ] 后端服务器监听端口 3001
- [ ] `server/.env` 文件存在
- [ ] `OPENAI_API_KEY` 已配置（如果需要 AI 功能）
- [ ] `YOUTUBE_API_KEY` 已配置（如果需要 YouTube 功能）
- [ ] 前端可以连接到后端 (`http://192.168.10.153:3001`)
- [ ] 健康检查端点正常 (`/health`)

### 生产环境

- [ ] 后端服务器已部署
- [ ] 生产环境后端 URL 已配置
- [ ] 环境变量已在部署平台配置
- [ ] `OPENAI_API_KEY` 已配置
- [ ] `YOUTUBE_API_KEY` 已配置
- [ ] CORS 已正确配置
- [ ] SSL 证书已配置 (HTTPS)
- [ ] 前端可以连接到生产后端

## 🔍 详细检查步骤

### 1. 检查后端服务器状态

```bash
# 进入服务器目录
cd MenuApp/server

# 检查服务器是否运行
curl http://localhost:3001/health

# 或者检查进程
lsof -i :3001
```

### 2. 检查环境变量配置

```bash
# 检查服务器环境变量
cd MenuApp/server
cat .env

# 应该包含:
# - OPENAI_API_KEY (如果需要 AI 功能)
# - YOUTUBE_API_KEY (如果需要 YouTube 功能)
# - PORT (可选，默认 3001)
```

### 3. 检查前端连接配置

```bash
# 检查前端配置
cat MenuApp/src/config/recipeImport.ts

# 应该包含:
# - 开发环境 URL (本地网络 IP)
# - 生产环境 URL (部署的后端 URL)
```

### 4. 测试后端连接

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试导入端点 (需要运行服务器)
curl -X POST http://localhost:3001/api/import-recipe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.recipetineats.com/chicken-chasseur/"}'
```

## 🚨 常见问题

### 问题 1: 无法连接到后端服务器

**症状**: 前端显示 "Cannot connect to backend server"

**解决方案**:
1. 检查后端服务器是否运行
2. 检查端口是否正确 (3001)
3. 检查网络连接
4. 检查防火墙设置
5. 检查本地网络 IP 是否正确

### 问题 2: API 密钥未配置

**症状**: AI 功能不可用，显示 "OpenAI API key not found"

**解决方案**:
1. 在 `server/.env` 中配置 `OPENAI_API_KEY`
2. 在 `server/.env` 中配置 `YOUTUBE_API_KEY`
3. 重启后端服务器

### 问题 3: 生产环境无法连接

**症状**: 生产环境无法使用后端功能

**解决方案**:
1. 部署后端服务器到生产环境
2. 更新 `src/config/recipeImport.ts` 中的生产环境 URL
3. 或在 EAS Secrets 中配置 `EXPO_PUBLIC_BACKEND_URL`
4. 测试生产环境连接

## 📝 配置示例

### server/.env 示例

```env
PORT=3001
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIza...
OPENAI_MODEL=gpt-4o-mini
```

### 前端环境变量示例

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_BACKEND_URL_DEV=http://192.168.10.153:3001
EXPO_PUBLIC_BACKEND_URL_PROD=https://your-backend.herokuapp.com
```

## 🎯 总结

### 当前连接状态

- ✅ **Supabase**: 已连接
- ⚠️ **后端服务器**: 开发环境可用，生产环境需要部署
- ⚠️ **环境变量**: 需要配置 API 密钥

### 下一步行动

1. 检查后端服务器是否运行
2. 配置环境变量
3. 部署后端服务器到生产环境
4. 更新生产环境配置
5. 测试所有功能

