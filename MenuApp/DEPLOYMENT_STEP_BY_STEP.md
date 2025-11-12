# iOS 部署详细步骤指南

## 📋 准备工作

### 1. 注册 Apple Developer 账号

1. 访问 https://developer.apple.com/programs/
2. 点击 "Enroll" 注册
3. 费用: $99/年 (个人开发者)
4. 审核时间: 通常 24-48 小时

### 2. 注册 Expo 账号

1. 访问 https://expo.dev/signup
2. 免费注册账号
3. 用于 EAS Build 服务

## 🔧 步骤 1: 安装工具

### 1.1 安装 EAS CLI

```bash
npm install -g eas-cli
```

验证安装:
```bash
eas --version
```

### 1.2 登录 Expo

```bash
cd MenuApp
eas login
```

## 🔧 步骤 2: 配置项目

### 2.1 初始化 EAS 项目

```bash
eas build:configure
```

这会:
- 创建或更新 `eas.json`
- 生成项目 ID
- 更新 `app.json` 中的 `extra.eas.projectId`

### 2.2 检查 app.json 配置

确保 `app.json` 包含以下配置:

```json
{
  "expo": {
    "name": "Chef iQ Studio",
    "slug": "chef-iq-studio",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.chefiq.studio",
      "buildNumber": "1"
    }
  }
}
```

## 🔧 步骤 3: 配置 Apple Developer

### 3.1 创建 App ID

1. 访问 https://developer.apple.com/account/
2. 登录 Apple Developer 账号
3. 进入 "Certificates, Identifiers & Profiles"
4. 点击 "Identifiers" > "+" 创建新标识符
5. 选择 "App IDs" > "Continue"
6. 填写信息:
   - Description: Chef iQ Studio
   - Bundle ID: `com.chefiq.studio` (必须与 app.json 中的一致)
7. 选择需要的 Capabilities:
   - Push Notifications (如果需要)
   - Associated Domains (如果需要)
   - Camera (需要)
   - Photo Library (需要)
8. 点击 "Continue" > "Register"

### 3.2 在 App Store Connect 创建应用

1. 访问 https://appstoreconnect.apple.com/
2. 登录 Apple Developer 账号
3. 点击 "我的 App" > "+" > "新 App"
4. 填写信息:
   - 平台: iOS
   - 名称: Chef iQ Studio
   - 主要语言: 简体中文 或 English
   - Bundle ID: `com.chefiq.studio`
   - SKU: `chef-iq-studio-001`
   - 用户访问权限: 完全访问权限
5. 点击 "创建"

## 🔧 步骤 4: 配置环境变量

### 4.1 设置 EAS 密钥

如果应用使用了环境变量，需要在 EAS 中设置:

```bash
# 设置 Supabase URL
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-supabase-url" --type string

# 设置 Supabase Key
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-supabase-key" --type string

# 设置 OpenAI API Key (如果需要)
eas secret:create --name OPENAI_API_KEY --value "your-openai-key" --type string

# 设置 YouTube API Key (如果需要)
eas secret:create --name YOUTUBE_API_KEY --value "your-youtube-key" --type string
```

### 4.2 查看已设置的密钥

```bash
eas secret:list
```

## 🏗️ 步骤 5: 构建应用

### 5.1 开发构建 (Development Build)

用于开发和测试:

```bash
eas build --platform ios --profile development
```

特点:
- 支持开发客户端
- 可以安装到模拟器
- 用于内部测试

### 5.2 预览构建 (Preview Build)

用于内部测试:

```bash
eas build --platform ios --profile preview
```

特点:
- 可以安装到真实设备
- 用于内部测试
- 不需要 App Store 审核

### 5.3 生产构建 (Production Build)

用于发布到 App Store:

```bash
eas build --platform ios --profile production
```

特点:
- 用于生产环境
- 可以提交到 App Store
- 需要 App Store 审核

### 5.4 构建过程

1. EAS 会在云端开始构建
2. 构建时间: 通常 10-20 分钟
3. 构建完成后会收到通知
4. 可以在 https://expo.dev/ 查看构建状态

## 📱 步骤 6: 安装到设备

### 6.1 方式 1: 直接下载安装

1. 构建完成后，EAS 会提供一个下载链接
2. 在 iOS 设备上打开 Safari 浏览器
3. 访问下载链接
4. 下载 `.ipa` 文件
5. 安装应用
6. 在设置中信任开发者证书:
   - 设置 > 通用 > VPN与设备管理
   - 找到您的开发者证书
   - 点击 "信任"

### 6.2 方式 2: 通过 TestFlight (推荐)

#### 6.2.1 提交到 App Store Connect

```bash
eas submit --platform ios
```

这会自动:
- 上传构建到 App Store Connect
- 处理签名和证书
- 关联到您的应用

#### 6.2.2 在 App Store Connect 中配置

1. 访问 https://appstoreconnect.apple.com/
2. 进入您的应用
3. 点击 "TestFlight" 标签
4. 等待构建处理完成 (通常 10-30 分钟)
5. 添加测试员:
   - 内部测试员: 最多 100 人 (需要是 App Store Connect 用户)
   - 外部测试员: 最多 10,000 人 (需要审核)

#### 6.2.3 测试员安装

1. 测试员会收到 TestFlight 邀请邮件
2. 在 iOS 设备上安装 TestFlight 应用
3. 打开 TestFlight 应用
4. 接受邀请
5. 安装应用

## 🚀 步骤 7: 发布到 App Store

### 7.1 准备应用信息

在 App Store Connect 中填写:

1. **应用信息**:
   - 应用名称
   - 副标题
   - 类别
   - 内容版权

2. **价格与销售范围**:
   - 价格 (免费或付费)
   - 销售范围

3. **应用隐私**:
   - 隐私政策 URL
   - 数据收集声明

4. **应用截图** (必需):
   - iPhone 6.7" (iPhone 14 Pro Max)
   - iPhone 6.5" (iPhone 11 Pro Max)
   - iPhone 5.5" (iPhone 8 Plus)
   - iPad Pro (12.9-inch)
   - iPad Pro (11-inch)

5. **应用描述**:
   - 应用描述
   - 关键词
   - 支持 URL
   - 营销 URL

### 7.2 提交审核

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
   - 回答审核问题
   - 提交审核

### 7.3 审核流程

- **审核时间**: 通常 1-3 个工作日
- **状态更新**: 在 App Store Connect 查看
- **审核通过**: 应用会自动上架
- **审核被拒**: 查看拒绝原因并修改后重新提交

## 🔄 步骤 8: 更新应用

### 8.1 更新版本号

在 `app.json` 中更新:

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

### 8.2 重新构建

```bash
eas build --platform ios --profile production
```

### 8.3 提交更新

```bash
eas submit --platform ios
```

## 🛠️ 常见问题

### Q1: 构建失败怎么办？

**解决方案**:
1. 查看构建日志: 在 https://expo.dev/ 查看详细日志
2. 检查 `app.json` 配置
3. 检查 Apple Developer 账号配置
4. 确保所有依赖都已正确安装
5. 检查环境变量是否正确设置

### Q2: 无法安装到设备？

**解决方案**:
1. 检查设备是否信任开发者证书
2. 确保 Bundle ID 匹配
3. 检查设备 UDID 是否已注册 (Ad Hoc 分发)
4. 确保设备系统版本支持应用

### Q3: 环境变量未加载？

**解决方案**:
1. 使用 `eas secret:create` 设置密钥
2. 确保环境变量前缀为 `EXPO_PUBLIC_` (客户端变量)
3. 在 `eas.json` 中配置环境变量
4. 重新构建应用

### Q4: 证书过期？

**解决方案**:
1. 重新构建应用 (EAS 会自动处理证书)
2. 在 Apple Developer 网站更新证书
3. 在 EAS 中重新配置证书

### Q5: TestFlight 构建处理失败？

**解决方案**:
1. 检查构建是否符合 App Store 要求
2. 检查应用信息是否完整
3. 查看 App Store Connect 中的错误信息
4. 联系 Apple 支持

## 📊 构建类型对比

| 构建类型 | 用途 | 分发方式 | 是否需要审核 | 有效期 |
|---------|------|---------|------------|--------|
| Development | 开发测试 | 直接安装 | 否 | 7 天 |
| Preview | 内部测试 | 直接安装/TestFlight | 否 | 90 天 |
| Production | 生产发布 | App Store | 是 | 永久 |

## 🔗 有用链接

- **Expo 文档**: https://docs.expo.dev/
- **EAS Build 文档**: https://docs.expo.dev/build/introduction/
- **Apple Developer**: https://developer.apple.com/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **TestFlight**: https://developer.apple.com/testflight/

## 📞 支持

如果遇到问题，可以:
1. 查看 Expo 文档
2. 访问 Expo Discord 社区
3. 查看 EAS Build 日志
4. 联系 Expo 支持团队
5. 查看 Apple Developer 文档

## 🎉 完成！

完成以上步骤后，您的应用就可以安装到 iOS 设备上了！

下一步:
1. 测试应用功能
2. 收集用户反馈
3. 修复 bug
4. 发布更新版本

