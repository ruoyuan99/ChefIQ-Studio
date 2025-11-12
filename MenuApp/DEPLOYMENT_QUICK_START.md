# iOS 部署快速开始指南

本指南将帮助您快速将 Chef iQ 应用部署到 iOS 设备上。

## 🚀 快速部署步骤

### 前置要求

1. **Apple Developer 账号** ($99/年)
   - 注册地址: https://developer.apple.com/programs/
   - 需要用于创建证书和分发应用

2. **Expo 账号** (免费)
   - 注册地址: https://expo.dev/signup
   - 用于 EAS Build 服务

### 步骤 1: 安装 EAS CLI

```bash
npm install -g eas-cli
```

验证安装:
```bash
eas --version
```

### 步骤 2: 登录 Expo 账号

```bash
cd MenuApp
eas login
```

如果没有账号，先注册:
```bash
eas register
```

### 步骤 3: 配置项目

项目已包含 `app.json` 和 `eas.json` 配置文件。

**重要**: 需要初始化 EAS 项目并生成项目 ID:

```bash
eas build:configure
```

这会自动生成 `projectId` 并更新 `app.json` 中的 `extra.eas.projectId`。

### 4. 配置 Apple Developer 账号

#### 4.1 创建 App ID

1. 访问 https://developer.apple.com/account/
2. 进入 "Certificates, Identifiers & Profiles"
3. 创建新的 App ID:
   - Description: Chef iQ
   - Bundle ID: `com.chefiq.app`
   - Capabilities: 启用所需功能

#### 4.2 创建应用 (App Store Connect)

1. 访问 https://appstoreconnect.apple.com/
2. 创建新应用:
   - 名称: Chef iQ
   - Bundle ID: `com.chefiq.app`
   - SKU: `chef-iq-001`

### 5. 构建 iOS 应用

#### 开发构建 (用于测试)

```bash
eas build --platform ios --profile development
```

#### 预览构建 (用于内部测试)

```bash
eas build --platform ios --profile preview
```

#### 生产构建 (用于发布)

```bash
eas build --platform ios --profile production
```

### 6. 安装到设备

#### 方式 1: 直接下载安装

1. 构建完成后，EAS 会提供一个下载链接
2. 在 iOS 设备上打开 Safari
3. 访问下载链接并下载
4. 安装应用
5. 在设置中信任开发者证书:
   - 设置 > 通用 > VPN与设备管理
   - 信任您的开发者证书

#### 方式 2: 通过 TestFlight (推荐)

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
   - 添加测试员
   - 测试员会收到 TestFlight 邀请

### 7. 发布到 App Store

1. 构建生产版本:
   ```bash
   eas build --platform ios --profile production
   ```

2. 提交到 App Store:
   ```bash
   eas submit --platform ios
   ```

3. 在 App Store Connect 中:
   - 填写应用信息
   - 上传截图
   - 提交审核

## 📋 检查清单

### 前置要求
- [ ] Apple Developer 账号 ($99/年)
- [ ] Expo 账号 (免费)
- [ ] EAS CLI 已安装
- [ ] 已登录 Expo 账号

### 配置检查
- [ ] `app.json` 配置正确
- [ ] `eas.json` 配置正确
- [ ] Bundle ID 已创建
- [ ] App Store Connect 应用已创建
- [ ] 环境变量已配置

### 构建检查
- [ ] 构建成功完成
- [ ] 应用可以下载
- [ ] 应用可以安装
- [ ] 应用可以运行

## 🔧 常见问题

### Q: 构建失败怎么办？

A: 
1. 检查 `app.json` 配置
2. 检查 Apple Developer 账号配置
3. 查看 EAS Build 日志
4. 确保所有依赖已安装

### Q: 无法安装到设备？

A:
1. 检查设备是否信任开发者证书
2. 确保 Bundle ID 匹配
3. 检查设备 UDID 是否已注册

### Q: 环境变量未加载？

A:
1. 使用 `eas secret:create` 设置密钥
2. 确保环境变量前缀为 `EXPO_PUBLIC_`
3. 在 `eas.json` 中配置环境变量

## 📞 需要帮助？

- Expo 文档: https://docs.expo.dev/
- EAS Build 文档: https://docs.expo.dev/build/introduction/
- Apple Developer: https://developer.apple.com/

## 🎉 完成！

完成以上步骤后，您的应用就可以安装到 iOS 设备上了！

