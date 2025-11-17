# 环境变量配置指南

本文档说明如何设置 Chef iQ Recipe App 的环境变量。

## 快速开始

### 方法 1: 使用设置脚本（推荐）

```bash
# MenuApp 目录
cd MenuApp
./setup-env.sh

# Server 目录
cd ../server
./setup-env.sh
```

### 方法 2: 手动设置

```bash
# 复制示例文件
cp env.example .env
# 然后编辑 .env 文件，填入你的实际 API 密钥
```

## 环境变量说明

### MenuApp/.env

#### 必需的环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase 项目设置 > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥（公开密钥，可暴露在客户端） | Supabase 项目设置 > API |

#### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `EXPO_PUBLIC_BACKEND_URL` | 后端服务器 URL（适用于所有环境） | 无（使用代码中的默认值） |
| `EXPO_PUBLIC_BACKEND_URL_DEV` | 开发环境后端 URL | `http://192.168.10.153:3001` |
| `EXPO_PUBLIC_BACKEND_URL_PROD` | 生产环境后端 URL | `https://your-backend-domain.com` |

**注意**: 如果设置了 `EXPO_PUBLIC_BACKEND_URL`，它会覆盖环境特定的 URL。

### server/.env

#### 必需的环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | https://platform.openai.com/api-keys |
| `YOUTUBE_API_KEY` | YouTube Data API 密钥 | Google Cloud Console > Credentials |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase 项目设置 > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase 项目设置 > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（⚠️ 服务器端专用，保密！） | Supabase 项目设置 > API > service_role key |

#### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 后端服务器端口 | `3001` |
| `OPENAI_MODEL` | OpenAI 模型 | `gpt-4o-mini` |
| `DISABLE_AI_RECIPE_GENERATION` | 禁用 AI 食谱生成（用于测试） | `false` |

## 获取 API 密钥

### 1. Supabase

1. 访问 https://app.supabase.com
2. 创建新项目或选择现有项目
3. 进入 **Project Settings > API**
4. 复制以下信息：
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 仅用于服务器端，保密！）

### 2. OpenAI

1. 访问 https://platform.openai.com
2. 注册/登录账户
3. 进入 **API Keys**: https://platform.openai.com/api-keys
4. 点击 **Create new secret key**
5. 复制密钥 → `OPENAI_API_KEY`

### 3. YouTube Data API

1. 访问 Google Cloud Console: https://console.cloud.google.com
2. 创建新项目或选择现有项目
3. 启用 **YouTube Data API v3**:
   - 进入 **APIs & Services > Library**
   - 搜索 "YouTube Data API v3"
   - 点击 **Enable**
4. 创建 API 密钥:
   - 进入 **APIs & Services > Credentials**
   - 点击 **Create Credentials > API Key**
   - 复制密钥 → `YOUTUBE_API_KEY`

## 本地开发配置

### 查找本地 IP 地址

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
```

找到类似 `192.168.x.x` 的 IP 地址，然后在 `MenuApp/.env` 中设置：
```env
EXPO_PUBLIC_BACKEND_URL_DEV=http://192.168.x.x:3001
```

### 不同平台的 localhost 地址

- **iOS Simulator**: `http://localhost:3001`
- **Android Emulator**: `http://10.0.2.2:3001`
- **真实设备**: `http://YOUR_LOCAL_IP:3001`（例如 `http://192.168.10.153:3001`）

## 验证配置

### 检查环境变量是否加载

在代码中，环境变量通过 `process.env.EXPO_PUBLIC_*` 访问。如果环境变量未正确加载，代码会使用 fallback 值。

### 测试 Supabase 连接

运行测试脚本：
```bash
cd MenuApp
node test-connection.js
```

## 安全注意事项

1. **永远不要提交 `.env` 文件到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 只提交 `env.example` 文件

2. **保护 Service Role Key**
   - `SUPABASE_SERVICE_ROLE_KEY` 具有管理员权限
   - 只在服务器端使用
   - 不要暴露在客户端代码中

3. **API 密钥管理**
   - 使用环境变量，不要硬编码
   - 定期轮换 API 密钥
   - 使用不同的密钥用于开发和生产环境

## 故障排除

### 环境变量未生效

1. **Expo 项目**: 重启 Expo 开发服务器（`npm start`）
2. **检查文件位置**: 确保 `.env` 文件在正确的目录（`MenuApp/` 或 `server/`）
3. **检查变量名**: Expo 只读取以 `EXPO_PUBLIC_` 开头的变量
4. **清除缓存**: `expo start -c`

### 后端连接失败

1. 检查后端服务器是否运行（`cd server && npm start`）
2. 检查端口是否正确（默认 3001）
3. 检查防火墙设置
4. 确保设备和服务器在同一网络

## 相关文件

- `MenuApp/env.example` - MenuApp 环境变量模板
- `MenuApp/server/env.example` - Server 环境变量模板
- `MenuApp/setup-env.sh` - MenuApp 自动设置脚本
- `MenuApp/server/setup-env.sh` - Server 自动设置脚本
- `.gitignore` - 确保 `.env` 文件不会被提交

