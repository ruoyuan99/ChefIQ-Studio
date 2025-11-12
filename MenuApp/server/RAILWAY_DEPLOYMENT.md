# Railway 部署指南 - 详细步骤

## 📋 前置要求

1. GitHub 账户
2. Railway 账户（免费注册）
3. OpenAI API 密钥
4. YouTube Data API 密钥

---

## 🚀 步骤 1: 创建 Railway 账户

1. 访问 [railway.app](https://railway.app)
2. 点击 "Start a New Project"
3. 选择 "Login with GitHub"
4. 授权 Railway 访问您的 GitHub 仓库

---

## 📦 步骤 2: 创建新项目

1. 在 Railway 仪表板，点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 选择您的仓库：`ruoyuan99/ChefIQ-Studio`
4. Railway 会自动检测项目

---

## ⚙️ 步骤 3: 配置服务

### 3.1 设置根目录

1. 点击创建的服务
2. 进入 **"Settings"** 标签
3. 找到 **"Root Directory"** 设置
4. 输入：`MenuApp/server`
5. 点击 **"Save"**

### 3.2 设置启动命令

在同一个 Settings 页面：

1. 找到 **"Start Command"**
2. 输入：`npm start`
3. 找到 **"Build Command"**（可选）
4. 输入：`npm install`
5. 点击 **"Save"**

---

## 🔐 步骤 4: 配置环境变量

1. 在服务页面，点击 **"Variables"** 标签
2. 点击 **"New Variable"** 添加以下变量：

### 必需的环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PORT` | `3001` | 服务器端口（Railway 会自动设置，但可以手动指定） |
| `OPENAI_API_KEY` | `your_openai_api_key` | 从 [OpenAI Platform](https://platform.openai.com/api-keys) 获取 |
| `YOUTUBE_API_KEY` | `your_youtube_api_key` | 从 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 获取 |

### 可选的环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI 模型（默认：gpt-4o-mini） |

**注意**：
- Railway 会自动设置 `PORT` 环境变量，但您也可以手动设置
- 确保 API 密钥没有多余的空格或引号
- 所有变量添加后，Railway 会自动重新部署

---

## 🚢 步骤 5: 部署

1. Railway 会自动检测到代码变更并开始部署
2. 在 **"Deployments"** 标签查看部署进度
3. 等待部署完成（通常 2-5 分钟）

---

## 🌐 步骤 6: 获取部署 URL

部署完成后：

1. 在服务页面，点击 **"Settings"** 标签
2. 找到 **"Domains"** 部分
3. 您会看到一个自动生成的域名，例如：
   ```
   https://chef-iq-backend-production.up.railway.app
   ```
4. 或者点击 **"Generate Domain"** 创建自定义域名

---

## ✅ 步骤 7: 测试部署

### 7.1 测试健康检查端点

在浏览器或终端中访问：

```bash
curl https://your-app-name.up.railway.app/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "Recipe Import Server"
}
```

### 7.2 查看日志

1. 在 Railway 服务页面，点击 **"Deployments"**
2. 选择最新的部署
3. 查看 **"Logs"** 标签
4. 确认看到：
   ```
   🚀 Recipe Import Server running on port 3001
   ✅ OpenAI API initialized
   📺 YouTube API Key: ✅ Configured
   ```

---

## 📱 步骤 8: 配置前端连接

### 方法 1: 使用环境变量（推荐）

在 `MenuApp/.env` 文件中添加：

```env
EXPO_PUBLIC_BACKEND_URL=https://your-app-name.up.railway.app
```

### 方法 2: 修改配置文件

编辑 `MenuApp/src/config/recipeImport.ts`：

```typescript
const PROD_BACKEND_URL = 'https://your-app-name.up.railway.app';
```

### 方法 3: EAS Build 环境变量

在 `MenuApp/eas.json` 中添加：

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://your-app-name.up.railway.app"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://your-app-name.up.railway.app"
      }
    }
  }
}
```

---

## 🔄 步骤 9: 重新构建移动应用

更新前端配置后，重新构建应用：

```bash
cd MenuApp
eas build --platform android --profile production
```

---

## 💰 Railway 定价

### 免费额度（Hobby Plan）

- **$5/月免费额度**
- 足够运行一个小型后端服务
- 超出后按使用量付费

### 查看使用量

1. 在 Railway 仪表板，点击您的项目
2. 查看 **"Usage"** 标签
3. 监控 CPU、内存和网络使用量

---

## 🐛 常见问题

### 问题 1: 部署失败

**可能原因**：
- 环境变量未正确设置
- 根目录配置错误
- 依赖安装失败

**解决方案**：
1. 检查 **"Deployments"** 标签中的错误日志
2. 确认 `Root Directory` 设置为 `MenuApp/server`
3. 确认所有必需的环境变量都已设置

### 问题 2: API 密钥错误

**解决方案**：
1. 检查环境变量中的 API 密钥是否正确
2. 确保没有多余的空格或引号
3. 重新部署以应用新的环境变量

### 问题 3: 无法访问端点

**解决方案**：
1. 确认服务正在运行（查看日志）
2. 检查域名是否正确
3. 测试健康检查端点：`/health`

### 问题 4: 端口错误

Railway 会自动设置 `PORT` 环境变量。如果遇到端口问题：

1. 在环境变量中，Railway 会自动提供 `PORT`
2. 不要手动设置 `PORT=3001`，让 Railway 自动管理
3. 或者使用 Railway 提供的 `PORT` 环境变量

---

## 📊 监控和维护

### 查看实时日志

1. 在服务页面，点击 **"Deployments"**
2. 选择最新的部署
3. 查看 **"Logs"** 标签

### 查看指标

1. 在服务页面，查看 **"Metrics"** 标签
2. 监控 CPU、内存使用情况
3. 查看请求量和响应时间

### 自动部署

Railway 会自动检测 GitHub 推送并重新部署。要禁用自动部署：

1. 进入服务 **"Settings"**
2. 找到 **"Source"** 部分
3. 可以配置分支和自动部署选项

---

## 🔒 安全建议

1. **保护 API 密钥**
   - 永远不要在代码中硬编码 API 密钥
   - 使用 Railway 的环境变量功能

2. **限制访问**
   - 考虑添加 API 密钥验证（如果需要）
   - Railway 自动提供 HTTPS

3. **监控使用量**
   - 定期检查 OpenAI 和 YouTube API 使用量
   - 设置使用量警报

---

## 📚 下一步

部署完成后：
1. ✅ 测试所有 API 端点
2. ✅ 更新前端配置
3. ✅ 重新构建移动应用
4. ✅ 测试完整流程

如有问题，请查看 Railway 日志或联系支持。

