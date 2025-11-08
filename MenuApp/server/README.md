# Recipe Import Backend Server

后端代理服务，用于从网站抓取和解析食谱信息，避免 CORS 限制。

## 功能

- ✅ 从网站抓取 HTML 内容
- ✅ 解析 Schema.org Recipe 结构化数据（JSON-LD）
- ✅ 提取食谱信息（标题、描述、食材、步骤、图片等）
- ✅ 处理各种数据格式和边缘情况
- ✅ CORS 支持
- ✅ 错误处理和超时控制

## 安装

```bash
cd server
npm install
```

## 配置

1. 复制 `.env.example` 到 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件（可选）：
```
PORT=3001
```

## 运行

### 开发模式（自动重启）
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

服务器将在 `http://localhost:3001` 启动。

## API 端点

### POST `/api/import-recipe`

导入食谱从 URL。

**请求体：**
```json
{
  "url": "https://www.recipetineats.com/chicken-chasseur/"
}
```

**成功响应：**
```json
{
  "success": true,
  "recipe": {
    "title": "Chicken Chasseur",
    "description": "...",
    "imageUrl": "https://...",
    "ingredients": [
      {
        "name": "chicken",
        "amount": "2",
        "unit": "pounds"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "description": "..."
      }
    ],
    "cookingTime": "30 minutes",
    "servings": "4 servings",
    "tags": ["French", "Main Course"]
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "Error message"
}
```

### GET `/health`

健康检查端点。

**响应：**
```json
{
  "status": "ok",
  "service": "Recipe Import Server",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 部署

### 本地开发

服务器运行在 `localhost:3001`，前端需要配置为使用此地址。

### 生产环境

建议部署到：
- **Heroku**
- **Railway**
- **Render**
- **Vercel** (需要 serverless 配置)
- **AWS Lambda** (需要 serverless 配置)
- **DigitalOcean**

部署后，更新前端的 `recipeImportService.ts` 中的 `backendUrl`。

## 支持的数据格式

- ✅ Schema.org Recipe JSON-LD
- ✅ ISO 8601 时间格式（PT30M, PT1H30M）
- ✅ 多种食材格式
- ✅ 多种步骤格式（HowToStep）
- ✅ 图片 URL 处理

## 故障排除

### 端口被占用

更改 `.env` 中的 `PORT` 值。

### 某些网站无法抓取

- 检查网站是否支持 Schema.org Recipe
- 某些网站可能有反爬虫机制
- 考虑使用代理服务

### 超时错误

默认超时时间为 30 秒。可以在 `server.js` 中调整 `AXIOS_TIMEOUT`。

## 安全性

- ✅ URL 验证
- ✅ 只允许 HTTP/HTTPS
- ✅ 请求超时控制
- ✅ 错误处理
- ⚠️ 生产环境建议添加：
  - 速率限制（Rate Limiting）
  - API 密钥验证
  - 请求日志记录
  - 黑名单/白名单域名

## 依赖

- `express` - Web 框架
- `axios` - HTTP 客户端
- `cheerio` - HTML 解析器
- `cors` - CORS 支持
- `dotenv` - 环境变量管理

