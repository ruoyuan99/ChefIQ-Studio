# Android 应用部署指南 - APK 下载包

本指南将帮助您构建 Android APK 文件，供评委通过下载包直接安装到手机上。

## 📋 部署选项概览

### 1. EAS Build (推荐) ⭐
- ✅ 云端构建，无需本地 Android Studio
- ✅ 自动生成 APK 文件
- ✅ 支持直接下载链接
- ✅ 适合快速分发
- ⚠️ 需要 Expo 账号（免费）

### 2. 本地构建
- ✅ 完全控制构建过程
- ❌ 需要 Android Studio 和配置环境
- ❌ 需要配置签名密钥
- ✅ 适合高级用户

## 🚀 推荐方案：EAS Build

我们推荐使用 **EAS Build** 构建 APK，这是最简单快速的方式。

---

## 📦 前置要求

### 1. Expo 账号
- 免费注册: https://expo.dev/signup
- 用于 EAS Build 服务（免费套餐足够使用）

### 2. Node.js 环境
- 确保已安装 Node.js (v16 或更高版本)
- 检查: `node --version`

### 3. 项目依赖
- 确保已安装所有依赖: `npm install`

---

## 🔧 步骤 1: 安装 EAS CLI

在项目根目录（`MenuApp`）打开终端，运行：

```bash
npm install -g eas-cli
```

验证安装：
```bash
eas --version
```

---

## 🔐 步骤 2: 登录 Expo 账号

```bash
eas login
```

按提示输入您的 Expo 账号邮箱和密码。

如果没有账号，先注册：
```bash
eas register
```

---

## ⚙️ 步骤 3: 配置 EAS 项目（如果需要）

如果这是第一次使用 EAS，需要初始化项目：

```bash
cd MenuApp
eas build:configure
```

这会自动更新 `app.json` 中的 `projectId`。

---

## 📱 步骤 4: 构建 Android APK

### 选项 A: 构建 Preview APK（推荐用于分发）

Preview profile 会生成一个可以直接安装的 APK 文件：

```bash
cd MenuApp
eas build --platform android --profile preview
```

### 选项 B: 构建 Development APK（用于测试）

如果需要开发版本：

```bash
cd MenuApp
eas build --platform android --profile development
```

### 构建过程

1. **选择构建选项**：
   - 当提示时，选择 "All build profiles" 或直接按回车使用默认配置
   
2. **等待构建完成**：
   - 构建在云端进行，通常需要 10-20 分钟
   - 您会看到构建进度和日志
   - 构建完成后会显示下载链接

3. **获取下载链接**：
   - 构建完成后，EAS 会提供一个下载链接
   - 链接格式类似：`https://expo.dev/artifacts/...`

---

## 📥 步骤 5: 下载 APK 文件

### 方法 1: 直接从构建输出下载

构建完成后，终端会显示下载链接，直接点击或复制到浏览器下载。

### 方法 2: 从 Expo Dashboard 下载

1. 访问 https://expo.dev/accounts/[your-account]/projects/chef-iq/builds
2. 找到最新的 Android 构建
3. 点击 "Download" 按钮下载 APK

### 方法 3: 使用 EAS CLI 下载

```bash
eas build:list --platform android
```

找到构建 ID，然后：

```bash
eas build:download --id [BUILD_ID]
```

---

## 📤 步骤 6: 分发 APK 给评委

### 方法 1: 直接分享文件（最简单）

1. 将 APK 文件上传到：
   - Google Drive
   - Dropbox
   - 或任何文件分享服务
2. 生成分享链接
3. 将链接发送给评委

### 方法 2: 使用二维码

1. 将 APK 上传到文件分享服务
2. 获取下载链接
3. 使用在线工具生成二维码（如 https://www.qr-code-generator.com/）
4. 评委扫描二维码即可下载

### 方法 3: 使用 Expo 的永久链接

EAS Build 会生成一个永久下载链接，可以直接分享。

---

## 📱 步骤 7: 评委安装 APK（评委指南）

### 在评委手机上安装：

1. **允许未知来源安装**：
   - 打开手机设置
   - 找到 "安全" 或 "隐私" 设置
   - 启用 "允许安装未知来源的应用" 或 "安装未知应用"
   - （不同手机品牌位置可能不同）

2. **下载 APK**：
   - 通过浏览器打开您提供的下载链接
   - 或扫描二维码下载

3. **安装应用**：
   - 下载完成后，点击通知栏的下载文件
   - 或在文件管理器中找到下载的 APK 文件
   - 点击 APK 文件，按提示安装

4. **首次运行**：
   - 安装完成后，在应用列表中找到 "Chef iQ"
   - 点击打开应用

---

## 🔍 验证构建配置

在构建前，可以检查 `eas.json` 配置：

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"  // ✅ 确保是 "apk" 而不是 "aab"
      }
    }
  }
}
```

当前配置已正确设置为生成 APK。

---

## 🛠️ 常见问题

### Q1: 构建失败怎么办？

**检查点：**
1. 确保已登录：`eas whoami`
2. 检查网络连接
3. 查看构建日志中的错误信息
4. 确保 `app.json` 配置正确

**常见错误：**
- `Project ID not found`: 运行 `eas build:configure`
- `Authentication failed`: 运行 `eas login` 重新登录

### Q2: APK 文件太大怎么办？

**优化建议：**
1. 使用 `eas build --platform android --profile preview --clear-cache`
2. 检查 `app.json` 中的 `assetBundlePatterns`，排除不需要的资源
3. 使用 ProGuard 代码混淆（生产构建）

### Q3: 评委无法安装 APK？

**检查：**
1. 确保评委已启用 "允许未知来源安装"
2. 检查 APK 文件是否完整下载
3. 确保手机 Android 版本兼容（最低 Android 5.0）

### Q4: 如何更新应用？

每次更新后，重新运行构建命令：

```bash
eas build --platform android --profile preview
```

新的 APK 会覆盖旧版本（如果包名相同）。

---

## 📊 构建状态检查

查看所有构建：

```bash
eas build:list --platform android
```

查看特定构建详情：

```bash
eas build:view [BUILD_ID]
```

---

## 🔐 签名配置（高级）

默认情况下，EAS 会使用 Expo 的默认签名密钥。如果需要使用自己的签名：

1. 生成密钥库：
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. 在 `eas.json` 中配置：
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    }
  }
}
```

3. 运行构建时，EAS 会提示上传密钥库。

---

## 📝 快速命令参考

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录
eas login

# 配置项目
eas build:configure

# 构建 APK
eas build --platform android --profile preview

# 查看构建列表
eas build:list --platform android

# 下载 APK
eas build:download --id [BUILD_ID]

# 查看构建详情
eas build:view [BUILD_ID]
```

---

## ✅ 部署检查清单

- [ ] 已安装 EAS CLI
- [ ] 已登录 Expo 账号
- [ ] 已配置 EAS 项目（`app.json` 中有 `projectId`）
- [ ] 已构建 Android APK
- [ ] 已下载 APK 文件
- [ ] 已准备分发方式（链接/二维码）
- [ ] 已向评委提供安装说明

---

## 🎯 推荐工作流程

1. **开发完成后**：
   ```bash
   cd MenuApp
   eas build --platform android --profile preview
   ```

2. **等待构建完成**（10-20 分钟）

3. **下载 APK**：
   - 从终端输出复制链接
   - 或从 Expo Dashboard 下载

4. **上传到文件分享服务**：
   - Google Drive / Dropbox / 等
   - 生成分享链接

5. **生成二维码**（可选）：
   - 使用在线工具生成二维码
   - 包含下载链接

6. **发送给评委**：
   - 分享下载链接
   - 或提供二维码
   - 附上安装说明

---

## 📞 需要帮助？

- EAS Build 文档: https://docs.expo.dev/build/introduction/
- Expo 社区: https://forums.expo.dev/
- 构建状态: https://expo.dev/accounts/[your-account]/projects/chef-iq/builds

---

**祝部署顺利！** 🚀

