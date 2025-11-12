# Railway 快速部署指南

## 🚀 5分钟快速部署

### 步骤 1: 登录 Railway
1. 访问 [railway.app](https://railway.app)
2. 点击 "Start a New Project"
3. 选择 "Login with GitHub"
4. 授权访问您的仓库

### 步骤 2: 创建项目
1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 选择仓库：`ruoyuan99/ChefIQ-Studio`
4. Railway 会自动创建服务

### 步骤 3: 配置服务
1. 点击创建的服务
2. 进入 **"Settings"** 标签
3. 设置 **Root Directory**: `MenuApp/server`
4. 点击 **"Save"**

### 步骤 4: 添加环境变量
1. 点击 **"Variables"** 标签
2. 添加以下变量：

```
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

**注意**：Railway 会自动设置 `PORT` 环境变量，不需要手动设置。

### 步骤 5: 等待部署
- Railway 会自动开始部署
- 在 **"Deployments"** 标签查看进度
- 通常需要 2-5 分钟

### 步骤 6: 获取 URL
1. 部署完成后，在 **"Settings"** → **"Domains"**
2. 复制生成的 URL，例如：
   ```
   https://chef-iq-backend-production.up.railway.app
   ```

### 步骤 7: 测试
```bash
curl https://your-app-name.up.railway.app/health
```

应该返回：
```json
{"status":"ok","service":"Recipe Import Server"}
```

### 步骤 8: 更新前端
在 `MenuApp/.env` 中添加：
```env
EXPO_PUBLIC_BACKEND_URL=https://your-app-name.up.railway.app
```

或更新 `MenuApp/src/config/recipeImport.ts`：
```typescript
const PROD_BACKEND_URL = 'https://your-app-name.up.railway.app';
```

---

## ✅ 完成！

现在您的后端已部署到 Railway，移动应用可以连接到它了。

---

## 📚 详细文档

查看 [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) 获取完整指南和故障排除。

