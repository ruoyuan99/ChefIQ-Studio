# Chef iQ Recipe App

A React Native recipe management app with AI-powered recipe generation, social features, and Chef iQ Challenge integration.

## Features

- 🍳 **Recipe Management**: Create, edit, and organize your recipes
- 🤖 **AI Recipe Generation**: Generate recipes from ingredients using OpenAI
- 📹 **YouTube Integration**: Find cooking videos related to your recipes
- 🏆 **Chef iQ Challenge**: Participate in cooking challenges with the iQ MiniOven
- 👥 **Social Features**: Like, favorite, comment, and share recipes
- 📱 **Cross-platform**: iOS and Android support with Expo
- 🔄 **Real-time Sync**: Sync recipes with Supabase backend

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini / GPT-4o
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage, AsyncStorage

## 环境变量配置

### 快速设置

**方法 1: 使用设置脚本（推荐）**
```bash
# MenuApp 目录
cd MenuApp
./setup-env.sh

# Server 目录
cd ../server
./setup-env.sh
```

**方法 2: 手动设置**
```bash
# 复制示例文件
cd MenuApp
cp env.example .env

cd ../server
cp env.example .env
```

### 环境变量说明

#### MenuApp/.env（必需）

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase 项目设置 > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase 项目设置 > API |

#### server/.env（必需）

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | https://platform.openai.com/api-keys |
| `YOUTUBE_API_KEY` | YouTube Data API 密钥 | Google Cloud Console > Credentials |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase 项目设置 > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase 项目设置 > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（⚠️ 服务器端专用，保密！） | Supabase 项目设置 > API > service_role key |

### 获取 API 密钥详细步骤

#### 1. Supabase
1. 访问 https://app.supabase.com
2. 创建新项目或选择现有项目
3. 进入 **Project Settings > API**
4. 复制以下信息：
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 仅用于服务器端，保密！）

#### 2. OpenAI
1. 访问 https://platform.openai.com
2. 注册/登录账户
3. 进入 **API Keys**: https://platform.openai.com/api-keys
4. 点击 **Create new secret key**
5. 复制密钥 → `OPENAI_API_KEY`

#### 3. YouTube Data API
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

### 安全注意事项

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

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account
- OpenAI API key
- YouTube Data API key (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Chef iQ RN"
```

2. Install dependencies:
```bash
cd MenuApp
npm install

cd ../server
npm install
```

3. Set up environment variables:

**Option A: Use the setup script (Recommended)**
```bash
# Setup MenuApp environment
cd MenuApp
./setup-env.sh

# Setup server environment
cd ../server
./setup-env.sh
```

**Option B: Manual setup**
```bash
# Copy example files
cd MenuApp
cp env.example .env

cd ../server
cp env.example .env
```

Then edit the `.env` files with your actual credentials:

**MenuApp/.env** (Required):
```env
# Supabase Configuration (Required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend URL (Optional - has defaults)
# For local development, uncomment and set your local IP:
# EXPO_PUBLIC_BACKEND_URL_DEV=http://192.168.10.153:3001
```

**server/.env** (Required):
```env
# Server Configuration
PORT=3001

# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# YouTube Data API Key (Required for YouTube features)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Supabase Configuration (Required for YouTube cache)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

4. Set up the database (if using Supabase):

   Run the database migration scripts in the `MenuApp/database/` directory:
   ```bash
   # In Supabase SQL Editor, run these files in order:
   # 1. schema.sql (or step1_tables.sql, step2_indexes.sql, step3_security.sql)
   # 2. recipe_surveys_table.sql (if using survey feature)
   ```
   
   **数据库表结构：**
   - `users` - 用户表
   - `recipes` - 菜谱表
   - `ingredients` - 食材表
   - `instructions` - 步骤表
   - `tags` - 标签表
   - `favorites` - 收藏表
   - `comments` - 评论表
   - `recipe_surveys` - 菜谱调查表（可选功能）

5. Start the development server:
```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start Expo app
cd MenuApp
npm start
```

## 本地运行指南

### 完整运行步骤

#### 1. 启动后端服务器

```bash
cd server
npm start
```

后端服务器将在 `http://localhost:3001` 启动。确保看到以下信息：
```
✅ Server is running on port 3001
```

#### 2. 启动 Expo 应用

在新的终端窗口中：

```bash
cd MenuApp
npm start
```

这将启动 Expo 开发服务器，你会看到：
- QR 码（用于在手机上扫描）
- 开发菜单选项

#### 3. 运行应用

**在 iOS 模拟器上运行：**
```bash
# 在 Expo 开发服务器启动后，按 'i' 键
# 或者
npm run ios
```

**在 Android 模拟器上运行：**
```bash
# 在 Expo 开发服务器启动后，按 'a' 键
# 或者
npm run android
```

**在真实设备上运行：**
1. 安装 Expo Go 应用（iOS App Store 或 Google Play）
2. 确保手机和电脑在同一 Wi-Fi 网络
3. 扫描终端中显示的 QR 码
4. 或者使用 Expo 开发菜单中的 "Enter URL manually" 选项

### 配置本地网络（真实设备）

如果使用真实设备，需要配置后端 URL：

1. **查找你的本地 IP 地址：**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   找到类似 `192.168.x.x` 的 IP 地址

2. **更新 MenuApp/.env：**
   ```env
   EXPO_PUBLIC_BACKEND_URL_DEV=http://192.168.x.x:3001
   ```

3. **重启 Expo 开发服务器：**
   ```bash
   # 按 Ctrl+C 停止，然后重新启动
   npm start
   ```

### 不同平台的 localhost 地址

| 平台 | 后端 URL |
|------|----------|
| iOS Simulator | `http://localhost:3001` |
| Android Emulator | `http://10.0.2.2:3001` |
| 真实设备 | `http://YOUR_LOCAL_IP:3001` |

### 开发工具

#### Expo 开发菜单

在应用中，你可以：
- **摇动设备**（iOS）或**按菜单键**（Android）打开开发菜单
- 或者按 `Cmd+D`（iOS）或 `Cmd+M`（Android）在模拟器中打开

开发菜单选项：
- **Reload** - 重新加载应用
- **Debug Remote JS** - 启用远程调试
- **Show Element Inspector** - 显示元素检查器
- **Enable Fast Refresh** - 启用快速刷新

#### 热重载

应用支持热重载（Hot Reload）：
- 修改代码后，应用会自动重新加载
- 如果修改了原生代码或配置文件，需要完全重启

#### 清除缓存

如果遇到问题，可以清除缓存：
```bash
# 清除 Expo 缓存
expo start -c

# 或者
npm start -- --clear
```

### 常见问题排查

#### 1. 后端连接失败

**症状：** 应用无法连接到后端服务器

**解决方案：**
- 确保后端服务器正在运行（`cd server && npm start`）
- 检查端口是否正确（默认 3001）
- 检查防火墙设置
- 确保设备和服务器在同一网络
- 检查 `MenuApp/.env` 中的 `EXPO_PUBLIC_BACKEND_URL_DEV` 配置

#### 2. 环境变量未生效

**症状：** 修改 `.env` 文件后，应用仍使用旧值

**解决方案：**
- 重启 Expo 开发服务器（`Ctrl+C` 然后 `npm start`）
- 确保变量名以 `EXPO_PUBLIC_` 开头
- 清除缓存：`expo start -c`

#### 3. Supabase 连接失败

**症状：** 无法连接到 Supabase 数据库

**解决方案：**
- 检查 `MenuApp/.env` 中的 Supabase 配置
- 验证 Supabase 项目是否正常运行
- 检查网络连接
- 查看浏览器控制台或终端中的错误信息

#### 4. 模块未找到错误

**症状：** `Module not found` 或 `Cannot find module`

**解决方案：**
```bash
# 删除 node_modules 和重新安装
rm -rf node_modules
npm install

# 如果问题仍然存在，清除所有缓存
rm -rf node_modules package-lock.json
npm install
```

#### 5. iOS 构建错误

**症状：** iOS 模拟器或设备无法启动应用

**解决方案：**
```bash
# 清理 iOS 构建缓存
cd ios
pod deintegrate
pod install
cd ..

# 重新启动
npm run ios
```

#### 6. Android 构建错误

**症状：** Android 模拟器或设备无法启动应用

**解决方案：**
```bash
# 清理 Android 构建缓存
cd android
./gradlew clean
cd ..

# 重新启动
npm run android
```

### 调试技巧

#### 1. 查看日志

**终端日志：**
- 后端服务器日志显示在 `server` 终端
- Expo 日志显示在 `MenuApp` 终端

**应用内日志：**
- 在开发模式下，`console.log` 会显示在终端
- 使用 React Native Debugger 查看更详细的日志

#### 2. 网络请求调试

**查看后端请求：**
- 后端服务器终端会显示所有 API 请求
- 检查请求路径、参数和响应

**查看前端请求：**
- 在浏览器中打开 `http://localhost:19002`（Expo DevTools）
- 使用 React Native Debugger 的网络面板

#### 3. 数据库调试

**Supabase Dashboard：**
- 访问 https://app.supabase.com
- 进入项目 > Table Editor 查看数据
- 使用 SQL Editor 运行查询

### 性能优化建议

1. **使用生产模式测试：**
   ```bash
   npm start -- --no-dev --minify
   ```

2. **监控网络请求：**
   - 使用 React Native Debugger 的网络面板
   - 检查是否有重复请求

3. **优化图片加载：**
   - 使用 `OptimizedImage` 组件
   - 启用图片缓存

### Quick Setup Checklist

- [ ] Installed Node.js and npm
- [ ] Cloned the repository
- [ ] Installed dependencies (`npm install` in both `MenuApp` and `server`)
- [ ] Created `.env` files from `env.example` in both directories
- [ ] Added Supabase credentials to both `.env` files
- [ ] Added OpenAI API key to `server/.env`
- [ ] Added YouTube API key to `server/.env`
- [ ] Set up Supabase database (run migration scripts)
- [ ] Started backend server (`cd server && npm start`)
- [ ] Started Expo app (`cd MenuApp && npm start`)

## Project Structure

```
Chef iQ RN/
├── MenuApp/                 # React Native app
│   ├── src/
│   │   ├── screens/         # Screen components
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── navigation/      # Navigation setup
│   │   └── types/           # TypeScript types
│   ├── database/            # Database migration scripts
│   │   ├── schema.sql       # Main database schema
│   │   ├── recipe_surveys_table.sql  # Survey feature table
│   │   └── ...              # Other migration scripts
│   ├── server/              # Backend server
│   │   ├── server.js        # Express server
│   │   └── package.json
│   ├── env.example          # Environment variables template
│   ├── setup-env.sh         # Environment setup script
│   └── package.json
└── README.md
```

## 核心功能实现

### 图片管理
- **自动上传**: 从网站导入的图片会自动下载并上传到 Supabase Storage
- **统一存储**: 所有图片存储在 Supabase Storage，确保持久性和可靠性
- **图片压缩**: 自动压缩图片以优化性能和存储空间
- **智能处理**: 支持本地图片和远程 URL，自动识别并处理

### 数据同步
- **实时同步**: 使用 Supabase 实时功能同步菜谱数据
- **离线支持**: 使用 AsyncStorage 缓存数据，支持离线访问
- **自动清理**: 同步成功后自动清理本地缓存，确保数据一致性
- **UUID 管理**: 使用 UUID 作为主键，确保全局唯一性

### 食谱来源统一
- **单一数据源**: 示例食谱使用硬编码数组，避免重复
- **智能去重**: 自动过滤重复的食谱，优先使用用户创建的版本
- **ID 管理**: 使用 UUID 确保唯一性，避免与示例食谱 ID 冲突

## Key Features

### Chef iQ Challenge
- Participate in cooking challenges
- Submit recipes made with Chef iQ MiniOven
- Compete for prizes and recognition
- Automatic tagging and cookware locking

### AI Recipe Generation
- Generate recipes from ingredients using OpenAI GPT-4o-mini / GPT-4o
- Multiple recipe options
- YouTube video recommendations
- Dietary restrictions and cuisine preferences

### Recipe Management
- Create and edit recipes
- Import recipes from URLs (with automatic image download and upload to Supabase Storage)
- Draft and publish workflow
- Image uploads (local images and remote URLs are automatically uploaded to Supabase Storage)
- Ingredient and instruction management
- Real-time sync with Supabase backend

### Recipe Survey Feature
- Users can provide feedback after trying a recipe
- Three survey questions:
  1. **Taste preference** (Like / Neutral / Dislike)
  2. **Difficulty level** (Easy / Medium / Hard)
  3. **Would make again?** (Yes / No)
- Community feedback statistics displayed on recipe detail page
- Data stored in `recipe_surveys` table (requires database migration: `recipe_surveys_table.sql`)

### Social Features
- Like, favorite, and comment on recipes
- Share recipes with share codes
- View community statistics (likes, favorites, views, tried count)
- Points system for user engagement

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For support, email support@chefiq.com

