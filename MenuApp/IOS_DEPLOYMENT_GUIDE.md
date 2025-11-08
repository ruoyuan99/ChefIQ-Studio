# iOS 部署指南 - Chef iQ Studio

本指南将帮助您在苹果手机上测试、发布和安装应用。

## 📋 目录

1. [准备工作](#准备工作)
2. [开发测试（快速测试）](#开发测试快速测试)
3. [构建 iOS 应用](#构建-ios-应用)
4. [TestFlight 内测](#testflight-内测)
5. [App Store 发布](#app-store-发布)
6. [常见问题](#常见问题)

---

## 准备工作

### 1. 安装必要工具

```bash
# 安装 EAS CLI（Expo Application Services）
npm install -g eas-cli

# 登录 Expo 账户
eas login
```

### 2. 配置 app.json

确保 `app.json` 包含 iOS 配置：

```json
{
  "expo": {
    "name": "Chef iQ Studio",
    "slug": "chef-iq-studio",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.chefiq.studio",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app needs access to your camera to take photos for recipes.",
        "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to select recipe images."
      }
    }
  }
}
```

### 3. 创建 EAS 项目

```bash
cd MenuApp
eas build:configure
```

这会创建 `eas.json` 配置文件。

---

## 开发测试（快速测试）

### 方法 1: 使用 Expo Go（最简单）

**适用于：快速测试，不需要原生模块**

1. **在 iPhone 上安装 Expo Go**
   - 从 App Store 下载 "Expo Go"

2. **启动开发服务器**
   ```bash
   cd MenuApp
   npm start
   ```

3. **扫描二维码**
   - 打开 Expo Go 应用
   - 扫描终端中显示的二维码
   - 应用会自动加载

**注意**：如果使用后端服务器（recipe import），确保手机和电脑在同一网络，并更新 `src/config/recipeImport.ts` 中的 IP 地址。

### 方法 2: 开发构建（Development Build）

**适用于：需要测试原生功能，或使用自定义原生代码**

1. **创建开发构建**
   ```bash
   eas build --profile development --platform ios
   ```

2. **安装到设备**
   - 构建完成后，EAS 会提供下载链接
   - 在 iPhone 上打开链接，安装应用
   - 首次安装需要信任开发者证书（设置 > 通用 > VPN与设备管理）

3. **启动开发服务器**
   ```bash
   npm start
   ```

4. **连接应用**
   - 打开已安装的开发构建应用
   - 扫描二维码或输入开发服务器地址

---

## 构建 iOS 应用

### 1. 配置 EAS Build

创建或更新 `eas.json`：

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
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
    "production": {}
  }
}
```

### 2. 构建预览版本（用于内部测试）

```bash
# 构建预览版本（ad-hoc 分发）
eas build --profile preview --platform ios
```

**构建类型说明**：
- `development`: 开发构建，需要开发服务器
- `preview`: 预览版本，可独立运行，用于内部测试
- `production`: 生产版本，用于 App Store 提交

### 3. 构建生产版本（用于 App Store）

```bash
# 构建生产版本
eas build --profile production --platform ios
```

**构建过程**：
1. EAS 会在云端构建应用
2. 构建时间约 10-20 分钟
3. 构建完成后会收到邮件通知
4. 在 EAS 控制台下载 `.ipa` 文件

---

## TestFlight 内测

### 1. 准备 Apple Developer 账户

- 注册 [Apple Developer Program](https://developer.apple.com/programs/)（$99/年）
- 确保账户已激活

### 2. 配置 Apple 证书

EAS 会自动处理证书，但需要提供：

```bash
# 配置 Apple 证书
eas credentials
```

选择：
- `iOS Distribution Certificate`
- `iOS Provisioning Profile`

### 3. 构建并提交到 TestFlight

```bash
# 构建生产版本
eas build --profile production --platform ios

# 提交到 App Store Connect
eas submit --platform ios
```

**或者分步操作**：

```bash
# 1. 先构建
eas build --profile production --platform ios

# 2. 等待构建完成，然后提交
eas submit --platform ios --latest
```

### 4. 在 App Store Connect 中设置

1. **登录 App Store Connect**
   - 访问 [App Store Connect](https://appstoreconnect.apple.com/)
   - 使用 Apple Developer 账户登录

2. **创建应用**
   - 点击 "我的 App"
   - 点击 "+" 创建新应用
   - 填写应用信息：
     - 名称：Chef iQ Studio
     - 主要语言：英语
     - Bundle ID：com.chefiq.studio（需先在 Apple Developer 中创建）
     - SKU：chef-iq-studio-001

3. **上传构建版本**
   - 如果使用 `eas submit`，构建会自动上传
   - 或手动上传：在 "TestFlight" 标签页，点击 "+" 上传 `.ipa` 文件

4. **添加测试用户**
   - 进入 "TestFlight" 标签页
   - 点击 "内部测试" 或 "外部测试"
   - 添加测试用户邮箱
   - 测试用户会收到邀请邮件

5. **测试应用**
   - 测试用户在 iPhone 上安装 TestFlight
   - 打开邀请邮件中的链接
   - 在 TestFlight 中安装应用

---

## App Store 发布

### 1. 准备应用信息

在 App Store Connect 中填写：

- **应用截图**：至少需要 iPhone 6.7" 和 6.5" 的截图
- **应用描述**：详细的应用介绍
- **关键词**：用于搜索优化
- **隐私政策 URL**：必需
- **应用图标**：1024x1024px
- **分类**：选择 "Food & Drink" 或 "Lifestyle"

### 2. 提交审核

1. **在 App Store Connect 中**
   - 选择构建版本
   - 填写所有必需信息
   - 点击 "提交以供审核"

2. **审核时间**
   - 通常 1-3 个工作日
   - 可能会收到审核反馈，需要修改后重新提交

3. **发布**
   - 审核通过后，应用会自动发布
   - 或设置定时发布

---

## 常见问题

### Q1: 构建失败，提示证书问题

**解决方案**：
```bash
# 清除并重新配置证书
eas credentials
# 选择 "Clear all credentials" 然后重新配置
```

### Q2: 应用无法连接到后端服务器

**解决方案**：
1. 检查 `src/config/recipeImport.ts` 中的 IP 地址
2. 确保手机和电脑在同一网络
3. 对于生产版本，需要配置生产环境的后端 URL

### Q3: TestFlight 安装后应用崩溃

**检查清单**：
- 检查 Supabase 配置是否正确
- 检查环境变量是否设置
- 查看崩溃日志（Xcode > Window > Devices and Simulators）

### Q4: 如何更新应用版本

**步骤**：
1. 更新 `app.json` 中的 `version` 和 `ios.buildNumber`
2. 重新构建：
   ```bash
   eas build --profile production --platform ios
   ```
3. 提交新版本：
   ```bash
   eas submit --platform ios --latest
   ```

### Q5: 需要修改 Bundle ID

**步骤**：
1. 更新 `app.json` 中的 `ios.bundleIdentifier`
2. 在 Apple Developer 中创建新的 App ID
3. 重新配置证书：
   ```bash
   eas credentials
   ```

---

## 快速命令参考

```bash
# 开发测试
npm start                    # 启动开发服务器
eas build --profile development --platform ios  # 开发构建

# 内部测试
eas build --profile preview --platform ios     # 预览构建

# TestFlight
eas build --profile production --platform ios  # 生产构建
eas submit --platform ios                      # 提交到 App Store Connect

# 查看构建状态
eas build:list

# 查看提交状态
eas submit:list
```

---

## 成本估算

- **Apple Developer Program**: $99/年（必需）
- **EAS Build**: 免费额度每月 30 次构建，超出后付费
- **TestFlight**: 免费（包含在 Apple Developer Program 中）
- **App Store**: 免费发布

---

## 下一步

1. ✅ 完成准备工作
2. ✅ 使用 Expo Go 进行快速测试
3. ✅ 创建开发构建进行深度测试
4. ✅ 构建预览版本进行内部测试
5. ✅ 提交到 TestFlight 进行 Beta 测试
6. ✅ 发布到 App Store

---

## 需要帮助？

- [Expo 文档](https://docs.expo.dev/)
- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [Apple Developer 文档](https://developer.apple.com/documentation/)

---

**祝您部署顺利！** 🚀

