# iOS 应用部署指南

本指南将帮助您将 Chef iQ React Native 应用部署到 iOS 设备上。

## 📋 部署选项概览

### 1. Expo Go (开发测试)
- ✅ 最简单快速
- ❌ 不支持自定义原生模块
- ❌ 不能使用应用内购买等高级功能
- ✅ 适合开发和快速测试

### 2. Development Build (开发构建)
- ✅ 支持所有原生功能
- ✅ 支持自定义原生模块
- ✅ 可以安装到设备上测试
- ⚠️ 需要 Apple Developer 账号
- ✅ 适合开发和内部测试

### 3. EAS Build (生产构建) ⭐ 推荐
- ✅ 支持所有原生功能
- ✅ 支持 TestFlight 和 App Store
- ✅ 云端构建，无需本地 Xcode
- ✅ 自动化构建流程
- ⚠️ 需要 Apple Developer 账号
- ✅ 适合生产环境部署

### 4. 本地构建
- ✅ 完全控制构建过程
- ❌ 需要 macOS 和 Xcode
- ❌ 需要配置开发环境
- ⚠️ 需要 Apple Developer 账号
- ✅ 适合高级用户

## 🚀 推荐方案：EAS Build

我们推荐使用 **EAS Build** 进行部署，这是 Expo 官方推荐的构建服务。

## 📦 前置要求

### 1. Apple Developer 账号
- 个人开发者: $99/年
- 企业开发者: $299/年
- 注册地址: https://developer.apple.com/programs/

### 2. Expo 账号
- 免费注册: https://expo.dev/signup
- 用于 EAS Build 服务

### 3. 开发环境
- macOS (用于本地构建，EAS Build 不需要)
- Node.js (已安装)
- Expo CLI (已安装)

## 🔧 步骤 1: 安装 EAS CLI

```bash
npm install -g eas-cli
```

验证安装:
```bash
eas --version
```

## 🔧 步骤 2: 登录 Expo 账号

```bash
eas login
```

如果没有账号，先注册:
```bash
eas register
```

## 🔧 步骤 3: 配置项目

### 3.1 创建 app.json 或更新 app.config.js

在项目根目录创建 `app.json` 文件（如果不存在）:

```json
{
  "expo": {
    "name": "Chef iQ",
    "slug": "chef-iq",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.chefiq.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app needs access to your camera to take photos of recipes.",
        "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to select recipe images.",
        "NSMicrophoneUsageDescription": "This app needs access to your microphone for voice instructions."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.chefiq.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-image-picker",
      "expo-camera",
      "expo-file-system"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 3.2 初始化 EAS 项目

```bash
cd MenuApp
eas build:configure
```

这会创建 `eas.json` 配置文件。

## 🔧 步骤 4: 配置 EAS Build

编辑 `eas.json` 文件:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

## 🔧 步骤 5: 配置 Apple Developer 账号

### 5.1 在 Apple Developer 网站创建 App ID

1. 访问 https://developer.apple.com/account/
2. 进入 "Certificates, Identifiers & Profiles"
3. 创建新的 App ID:
   - Bundle ID: `com.chefiq.app`
   - Capabilities: 启用所需功能（Push Notifications, Associated Domains 等）

### 5.2 在 App Store Connect 创建应用

1. 访问 https://appstoreconnect.apple.com/
2. 创建新应用:
   - 名称: Chef iQ
   - Bundle ID: `com.chefiq.app`
   - SKU: `chef-iq-001`

## 🏗️ 步骤 6: 构建 iOS 应用

### 6.1 开发构建 (Development Build)

```bash
eas build --platform ios --profile development
```

### 6.2 预览构建 (Preview Build) - 用于测试

```bash
eas build --platform ios --profile preview
```

### 6.3 生产构建 (Production Build) - 用于发布

```bash
eas build --platform ios --profile production
```

构建过程会在云端进行，通常需要 10-20 分钟。

## 📱 步骤 7: 安装到设备

### 7.1 通过 EAS Build 网页下载

1. 构建完成后，EAS 会提供一个下载链接
2. 在 iOS 设备上打开 Safari 浏览器
3. 访问下载链接
4. 下载并安装应用
5. 在设置中信任开发者证书:
   - 设置 > 通用 > VPN与设备管理
   - 信任您的开发者证书

### 7.2 通过 TestFlight 分发 (推荐)

1. 构建生产版本:
   ```bash
   eas build --platform ios --profile production
   ```

2. 提交到 App Store Connect:
   ```bash
   eas submit --platform ios
   ```

3. 在 App Store Connect 中:
   - 进入 "TestFlight" 标签
   - 添加内部测试员或外部测试员
   - 测试员会收到 TestFlight 邀请邮件

4. 测试员安装 TestFlight 应用并接受邀请

## 🚀 步骤 8: 发布到 App Store

### 8.1 准备应用信息

在 App Store Connect 中填写:
- 应用描述
- 关键词
- 截图 (各种尺寸)
- 应用图标
- 隐私政策 URL
- 支持 URL

### 8.2 提交审核

1. 构建生产版本:
   ```bash
   eas build --platform ios --profile production
   ```

2. 提交到 App Store:
   ```bash
   eas submit --platform ios
   ```

3. 在 App Store Connect 中:
   - 选择构建版本
   - 填写审核信息
   - 提交审核

### 8.3 审核流程

- 审核时间: 通常 1-3 个工作日
- 状态更新: 在 App Store Connect 查看
- 审核通过后: 应用会自动上架

## 🔐 步骤 9: 配置环境变量

### 9.1 创建 .env 文件

确保 `.env` 文件包含所有必要的环境变量:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

### 9.2 在 EAS Build 中配置密钥

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value your-supabase-url --type string
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-supabase-anon-key --type string
eas secret:create --name OPENAI_API_KEY --value your-openai-api-key --type string
eas secret:create --name YOUTUBE_API_KEY --value your-youtube-api-key --type string
```

## 📝 步骤 10: 更新版本号

### 10.1 更新 app.json

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

### 10.2 重新构建

```bash
eas build --platform ios --profile production
```

## 🛠️ 常见问题

### 1. 构建失败

**问题**: 构建过程中出现错误

**解决方案**:
- 检查 `app.json` 配置是否正确
- 检查 Apple Developer 账号配置
- 查看 EAS Build 日志获取详细错误信息
- 确保所有依赖都已正确安装

### 2. 无法安装到设备

**问题**: 下载后无法安装

**解决方案**:
- 检查设备是否信任开发者证书
- 确保 Bundle ID 匹配
- 检查设备 UDID 是否已注册

### 3. 证书过期

**问题**: 应用无法运行，提示证书过期

**解决方案**:
- 重新构建应用
- 更新 Apple Developer 证书
- 在 EAS Build 中重新配置证书

### 4. 环境变量未加载

**问题**: 应用运行时环境变量为空

**解决方案**:
- 检查 `.env` 文件是否存在
- 确保环境变量前缀为 `EXPO_PUBLIC_`
- 在 `eas.json` 中配置环境变量
- 使用 `eas secret:create` 设置密钥

## 📊 构建类型对比

| 构建类型 | 用途 | 分发方式 | 是否需要审核 |
|---------|------|---------|------------|
| Development | 开发测试 | 直接安装 | 否 |
| Preview | 内部测试 | 直接安装/TestFlight | 否 |
| Production | 生产发布 | App Store | 是 |

## 🔗 有用链接

- Expo 文档: https://docs.expo.dev/
- EAS Build 文档: https://docs.expo.dev/build/introduction/
- Apple Developer: https://developer.apple.com/
- App Store Connect: https://appstoreconnect.apple.com/
- TestFlight: https://developer.apple.com/testflight/

## 📞 支持

如果遇到问题，可以:
1. 查看 Expo 文档
2. 访问 Expo Discord 社区
3. 查看 EAS Build 日志
4. 联系 Expo 支持团队

## 🎉 完成！

完成以上步骤后，您的应用就可以安装到 iOS 设备上了！

下一步:
1. 测试应用功能
2. 收集用户反馈
3. 修复 bug
4. 发布更新版本

