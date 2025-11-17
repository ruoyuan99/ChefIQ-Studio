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

## Documentation

- **[Environment Setup Guide](MenuApp/ENVIRONMENT_SETUP.md)** - 详细的环境变量配置指南
- **[本地运行指南](#本地运行指南)** - 完整的本地开发和运行指南（包含故障排查）

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

### Getting API Keys

1. **Supabase**:
   - Sign up at https://app.supabase.com
   - Create a new project
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key
   - For service role key, copy the `service_role` key (⚠️ keep this secret!)

2. **OpenAI**:
   - Sign up at https://platform.openai.com
   - Go to API Keys: https://platform.openai.com/api-keys
   - Create a new API key

3. **YouTube Data API**:
   - Go to Google Cloud Console: https://console.cloud.google.com
   - Create a new project or select existing
   - Enable "YouTube Data API v3"
   - Go to Credentials and create an API Key

4. Set up the database (if using Supabase):

   Run the database migration scripts in the `MenuApp/database/` directory:
   ```bash
   # In Supabase SQL Editor, run these files in order:
   # 1. schema.sql (or step1_tables.sql, step2_indexes.sql, step3_security.sql)
   # 2. recipe_surveys_table.sql (if using survey feature)
   ```

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
│   └── package.json
├── server/                  # Backend server
│   ├── server.js           # Express server
│   └── package.json
└── README.md
```

## Key Features

### Chef iQ Challenge
- Participate in cooking challenges
- Submit recipes made with Chef iQ MiniOven
- Compete for prizes and recognition
- Automatic tagging and cookware locking

### AI Recipe Generation
- Generate recipes from ingredients
- Multiple recipe options
- YouTube video recommendations
- Dietary restrictions and cuisine preferences

### Recipe Management
- Create and edit recipes
- Import recipes from URLs
- Draft and publish workflow
- Image uploads
- Ingredient and instruction management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For support, email support@chefiq.com

