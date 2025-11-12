# CI/CD 设置步骤

按照以下步骤完成 CI/CD 配置。

---

## 📋 前置要求

- [ ] GitHub 账号
- [ ] Expo 账号 (免费注册: https://expo.dev/signup)
- [ ] 代码已推送到 GitHub 仓库

---

## 🔧 步骤 1: 配置 Expo 访问令牌

1. 访问 Expo Dashboard: https://expo.dev/accounts/[your-account]/settings/access-tokens

2. 点击 **"Create Token"**

3. 输入名称: `GitHub Actions CI/CD`

4. 选择权限: **Full Access** (或根据需要选择)

5. 复制生成的令牌（只显示一次，请妥善保存）

---

## 🔐 步骤 2: 配置 GitHub Secrets

1. 打开 GitHub 仓库

2. 进入 **Settings** → **Secrets and variables** → **Actions**

3. 点击 **"New repository secret"**

4. 添加以下 Secret:

   **EXPO_TOKEN**
   - Name: `EXPO_TOKEN`
   - Value: 粘贴步骤 1 中复制的 Expo 访问令牌
   - 点击 **"Add secret"**

   **可选 Secrets** (如果需要测试后端):
   - `OPENAI_API_KEY`: OpenAI API 密钥
   - `YOUTUBE_API_KEY`: YouTube API 密钥

---

## ⚙️ 步骤 3: 配置 EAS 项目

在本地运行以下命令：

```bash
# 进入项目目录
cd MenuApp

# 安装 EAS CLI (如果还没有)
npm install -g eas-cli

# 登录 Expo
eas login

# 配置 EAS 项目
eas build:configure
```

这会自动更新 `app.json` 中的 `projectId`。

---

## 📝 步骤 4: 提交工作流文件

工作流文件已经创建在 `.github/workflows/` 目录：

- `ci.yml` - CI 流程（测试和检查）
- `build.yml` - 构建流程（自动构建应用）

提交这些文件：

```bash
# 添加文件
git add .github/workflows/

# 提交
git commit -m "Add CI/CD workflows"

# 推送到 GitHub
git push
```

---

## ✅ 步骤 5: 验证 CI/CD

### 验证 CI 流程

1. 推送代码或创建 PR
2. 访问 GitHub 仓库的 **Actions** 标签页
3. 查看工作流运行状态
4. 确认测试通过

### 验证构建流程

1. 合并代码到 `main` 分支
2. 或手动触发构建:
   - 进入 **Actions** → **Build** → **Run workflow**
   - 选择平台 (android/ios/all)
   - 点击 **"Run workflow"**

3. 查看构建状态:
   - GitHub Actions 日志
   - Expo Dashboard: https://expo.dev/accounts/[your-account]/projects/chef-iq/builds

---

## 🎯 工作流说明

### CI 工作流 (`ci.yml`)

**触发时机**:
- 每次 Push 到 `main`/`develop`/`master` 分支
- 每次创建/更新 Pull Request

**执行任务**:
1. 安装依赖
2. TypeScript 类型检查
3. 运行单元测试
4. 上传测试覆盖率（可选）

### 构建工作流 (`build.yml`)

**触发时机**:
- 合并到 `main`/`master` 分支
- 手动触发 (workflow_dispatch)

**执行任务**:
1. 安装依赖
2. 配置 EAS
3. 构建 Android APK (preview profile)
4. 构建 iOS IPA (如果选择)

---

## 🔍 故障排除

### 问题 1: "EXPO_TOKEN not found"

**解决方案**:
- 确保已在 GitHub Secrets 中添加 `EXPO_TOKEN`
- 检查 Secret 名称是否正确（区分大小写）

### 问题 2: "EAS project not configured"

**解决方案**:
```bash
cd MenuApp
eas build:configure
```

### 问题 3: 构建失败

**解决方案**:
- 检查 Expo Dashboard 的构建日志
- 验证 `eas.json` 配置
- 确认 EAS Secrets 已设置（如果需要）

### 问题 4: 测试失败

**解决方案**:
- 检查测试环境变量
- 验证依赖安装
- 查看 GitHub Actions 日志

---

## 📊 监控构建状态

### GitHub Actions

访问: `https://github.com/[username]/[repo]/actions`

### Expo Dashboard

访问: `https://expo.dev/accounts/[your-account]/projects/chef-iq/builds`

---

## 🚀 下一步

1. **测试 CI 流程**: 推送代码，查看测试是否通过
2. **测试构建流程**: 合并到 main 分支，触发构建
3. **配置通知** (可选): 添加 Slack/Discord 通知
4. **优化构建** (可选): 添加缓存、并行构建等

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 GitHub Actions 日志
2. 查看 Expo Dashboard 构建日志
3. 参考文档:
   - [GitHub Actions 文档](https://docs.github.com/en/actions)
   - [EAS Build 文档](https://docs.expo.dev/build/introduction/)

---

**配置完成后，您的 CI/CD 流程就自动运行了！** 🎉

