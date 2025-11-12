# 后端服务器快速启动指南

## 🚀 本地开发（5分钟快速开始）

### 1. 进入服务器目录
```bash
cd MenuApp/server
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
# 复制示例文件
cp env.example .env

# 编辑 .env 文件，填入您的 API 密钥
# 使用您喜欢的编辑器打开 .env 文件
```

必需的 API 密钥：
- `OPENAI_API_KEY` - 从 [OpenAI Platform](https://platform.openai.com/api-keys) 获取
- `YOUTUBE_API_KEY` - 从 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 获取

### 4. 启动服务器
```bash
npm start
```

您应该看到：
```
🚀 Recipe Import Server running on port 3001
📡 Health check: http://localhost:3001/health
```

### 5. 测试服务器
打开新终端窗口：
```bash
curl http://localhost:3001/health
```

应该返回：
```json
{"status":"ok","service":"Recipe Import Server"}
```

## ✅ 完成！

现在您的后端服务器正在运行，移动应用可以连接到它了。

**注意**：确保您的手机和电脑在同一个 WiFi 网络上。

---

## 📱 配置移动应用

### 方法 1: 使用环境变量（推荐）

在 `MenuApp/.env` 文件中添加：
```env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_COMPUTER_IP:3001
```

查找您的电脑 IP 地址：
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### 方法 2: 修改配置文件

编辑 `MenuApp/src/config/recipeImport.ts`，更新 `LOCAL_NETWORK_IP`：
```typescript
const LOCAL_NETWORK_IP = 'YOUR_COMPUTER_IP'; // 例如: '192.168.1.100'
```

---

## 🌐 部署到云平台

如果您需要将后端部署到云平台（以便随时随地访问），请查看：
- [完整部署指南](./DEPLOYMENT_GUIDE.md)

**推荐平台**：
- **Railway** - 最简单，$5/月免费额度
- **Render** - 完全免费（但会休眠）

---

## 🐛 常见问题

### 问题：无法连接到服务器

**解决方案**：
1. 确保服务器正在运行（检查终端输出）
2. 确保手机和电脑在同一 WiFi 网络
3. 检查防火墙设置
4. 尝试使用电脑的 IP 地址而不是 localhost

### 问题：API 密钥错误

**解决方案**：
1. 检查 `.env` 文件中的 API 密钥是否正确
2. 确保没有多余的空格或引号
3. 重启服务器

### 问题：端口被占用

**解决方案**：
1. 修改 `.env` 文件中的 `PORT=3002`
2. 更新前端配置中的端口号

---

## 📚 更多信息

- [完整部署指南](./DEPLOYMENT_GUIDE.md) - 云平台部署详细步骤
- [环境变量说明](./env.example) - 所有配置选项

