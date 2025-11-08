# 快速启动指南

## 1. 安装依赖

```bash
cd server
npm install
```

## 2. 配置环境变量（可选）

```bash
cp env.example .env
```

编辑 `.env` 文件（如果需要更改端口）：
```
PORT=3001
```

## 3. 启动服务器

### 开发模式（推荐）
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

服务器将在 `http://localhost:3001` 启动。

## 4. 测试服务器

### 健康检查
```bash
curl http://localhost:3001/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "Recipe Import Server",
  "timestamp": "..."
}
```

### 测试导入功能
```bash
curl -X POST http://localhost:3001/api/import-recipe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.recipetineats.com/chicken-chasseur/"}'
```

## 5. 在 React Native 应用中使用

确保前端配置正确：
- 开发环境：自动使用 `http://localhost:3001`
- 生产环境：在 `src/config/recipeImport.ts` 中配置生产 URL

## 6. 常见问题

### 端口被占用
更改 `.env` 中的 `PORT` 值，或使用其他端口：
```bash
PORT=3002 npm start
```

### 无法连接到服务器
- 确保服务器正在运行
- 检查端口是否正确
- 对于 iOS 模拟器，使用 `localhost`
- 对于 Android 模拟器，使用 `10.0.2.2`（需要更新配置）

### Android 模拟器连接问题
如果使用 Android 模拟器，需要修改 `src/config/recipeImport.ts`：
```typescript
const DEV_BACKEND_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001'  // Android 模拟器
  : 'http://localhost:3001'; // iOS 模拟器/真实设备
```

## 下一步

1. ✅ 测试本地导入功能
2. 📦 部署到生产环境（Heroku, Railway, Render 等）
3. 🔧 更新生产环境 URL 配置
4. 🔒 添加安全措施（速率限制、API 密钥等）

## 部署选项

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Railway
1. 连接 GitHub 仓库
2. 自动检测 Node.js 项目
3. 自动部署

### Render
1. 创建新的 Web Service
2. 连接 GitHub 仓库
3. 设置构建命令：`npm install`
4. 设置启动命令：`npm start`

