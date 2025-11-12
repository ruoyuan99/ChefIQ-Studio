# 后端服务器部署指南

本指南将帮助您部署 Chef iQ 后端服务器到云平台，以便移动应用可以访问。

## 📋 目录

1. [快速开始（本地开发）](#快速开始本地开发)
2. [云平台部署选项](#云平台部署选项)
3. [Railway 部署（推荐）](#railway-部署推荐)
4. [Render 部署](#render-部署)
5. [Heroku 部署](#heroku-部署)
6. [配置前端连接](#配置前端连接)
7. [环境变量配置](#环境变量配置)
8. [故障排除](#故障排除)

---

## 快速开始（本地开发）

### 1. 安装依赖

```bash
cd MenuApp/server
npm install
```

### 2. 配置环境变量

复制 `env.example` 并创建 `.env` 文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，填入您的 API 密钥：

```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3001` 运行。

### 4. 测试服务器

```bash
curl http://localhost:3001/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "Recipe Import Server"
}
```

---

## 云平台部署选项

### 推荐平台对比

| 平台 | 免费额度 | 优点 | 缺点 |
|------|---------|------|------|
| **Railway** | $5/月免费额度 | 部署简单，自动 HTTPS | 免费额度有限 |
| **Render** | 免费计划可用 | 完全免费，自动部署 | 免费计划会休眠 |
| **Heroku** | 不再免费 | 稳定可靠 | 需要付费 |
| **Fly.io** | 免费额度 | 全球部署 | 配置较复杂 |

**推荐：Railway**（最简单）或 **Render**（免费）

---

## Railway 部署（推荐）

### 步骤 1: 创建 Railway 账户

1. 访问 [Railway.app](https://railway.app)
2. 使用 GitHub 账户登录

### 步骤 2: 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择您的仓库 `ChefIQ-Studio`
4. 选择 "Add Service" → "Empty Service"

### 步骤 3: 配置服务

1. 在服务设置中，点击 "Settings"
2. 设置以下配置：
   - **Root Directory**: `MenuApp/server`
   - **Start Command**: `npm start`
   - **Build Command**: `npm install`

### 步骤 4: 配置环境变量

在 Railway 项目设置中添加环境变量：

```
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 步骤 5: 部署

Railway 会自动检测到代码变更并部署。部署完成后，您会获得一个 URL，例如：
```
https://your-app-name.up.railway.app
```

### 步骤 6: 测试部署

```bash
curl https://your-app-name.up.railway.app/health
```

---

## Render 部署

### 步骤 1: 创建 Render 账户

1. 访问 [Render.com](https://render.com)
2. 使用 GitHub 账户登录

### 步骤 2: 创建 Web Service

1. 点击 "New +" → "Web Service"
2. 连接您的 GitHub 仓库
3. 配置服务：
   - **Name**: `chef-iq-backend`
   - **Root Directory**: `MenuApp/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 步骤 3: 配置环境变量

在 "Environment" 标签页添加：

```
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 步骤 4: 部署

点击 "Create Web Service"，Render 会自动部署。

**注意**：免费计划会在 15 分钟无活动后休眠，首次请求可能需要 30-60 秒唤醒。

---

## Heroku 部署

### 步骤 1: 安装 Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# 或访问 https://devcenter.heroku.com/articles/heroku-cli
```

### 步骤 2: 登录 Heroku

```bash
heroku login
```

### 步骤 3: 创建应用

```bash
cd MenuApp/server
heroku create your-app-name
```

### 步骤 4: 配置环境变量

```bash
heroku config:set OPENAI_API_KEY=your_openai_api_key_here
heroku config:set OPENAI_MODEL=gpt-4o-mini
heroku config:set YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 步骤 5: 部署

```bash
git subtree push --prefix MenuApp/server heroku main
```

或者使用 Heroku Git：

```bash
heroku git:remote -a your-app-name
git push heroku main
```

---

## 配置前端连接

部署完成后，需要更新前端配置以连接到部署的后端。

### 方法 1: 使用环境变量（推荐）

在 `MenuApp/.env` 文件中添加：

```env
EXPO_PUBLIC_BACKEND_URL=https://your-app-name.up.railway.app
```

或者分别配置开发和生产：

```env
EXPO_PUBLIC_BACKEND_URL_DEV=http://localhost:3001
EXPO_PUBLIC_BACKEND_URL_PROD=https://your-app-name.up.railway.app
```

### 方法 2: 修改配置文件

编辑 `MenuApp/src/config/recipeImport.ts`：

```typescript
const PROD_BACKEND_URL = 'https://your-app-name.up.railway.app';
```

### 方法 3: EAS Build 环境变量

在 `eas.json` 中添加环境变量：

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://your-app-name.up.railway.app"
      }
    }
  }
}
```

---

## 环境变量配置

### 必需的环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `YOUTUBE_API_KEY` | YouTube Data API 密钥 | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

### 可选的环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `3001` | 服务器端口 |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI 模型（gpt-4o-mini, gpt-4o, gpt-4-turbo） |

---

## 故障排除

### 问题 1: 无法连接到后端

**检查清单**：
- ✅ 后端服务器是否正在运行？
- ✅ 后端 URL 是否正确配置？
- ✅ 防火墙是否阻止了连接？
- ✅ 环境变量是否正确设置？

**测试连接**：
```bash
curl https://your-backend-url.com/health
```

### 问题 2: CORS 错误

后端已配置 CORS，如果仍有问题，检查 `server.js` 中的 CORS 配置：

```javascript
app.use(cors());
```

### 问题 3: API 密钥错误

确保环境变量正确设置：
- 在云平台的环境变量设置中检查
- 确保没有多余的空格或引号
- 重新部署以应用新的环境变量

### 问题 4: 端口冲突

如果默认端口 3001 被占用，可以修改：

```env
PORT=3002
```

并更新前端配置中的端口号。

### 问题 5: Render 免费计划休眠

Render 免费计划会在 15 分钟无活动后休眠。解决方案：
1. 使用 Render 的 "Always On" 功能（需要付费）
2. 使用外部监控服务定期 ping 您的服务器
3. 升级到付费计划

---

## 监控和维护

### 查看日志

**Railway**:
- 在项目页面点击服务 → "Deployments" → 查看日志

**Render**:
- 在服务页面点击 "Logs" 标签

**Heroku**:
```bash
heroku logs --tail -a your-app-name
```

### 健康检查

定期检查服务器健康状态：

```bash
curl https://your-backend-url.com/health
```

### 更新部署

推送代码到 GitHub 后，Railway 和 Render 会自动重新部署。Heroku 需要手动推送：

```bash
git push heroku main
```

---

## 安全建议

1. **不要提交 `.env` 文件到 Git**
   - 确保 `.env` 在 `.gitignore` 中

2. **使用环境变量存储敏感信息**
   - 永远不要在代码中硬编码 API 密钥

3. **限制 API 访问**
   - 考虑添加 API 密钥验证
   - 使用 HTTPS（云平台通常自动提供）

4. **监控 API 使用量**
   - 定期检查 OpenAI 和 YouTube API 使用量
   - 设置使用量警报

---

## 下一步

部署完成后：
1. ✅ 测试所有 API 端点
2. ✅ 更新前端配置
3. ✅ 重新构建移动应用
4. ✅ 测试完整流程

如有问题，请查看服务器日志或联系支持。

