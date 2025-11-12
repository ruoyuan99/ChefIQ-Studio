# CI/CD 快速开始指南

5 分钟快速设置 CI/CD 流程。

---

## ⚡ 快速步骤

### 1️⃣ 获取 Expo 访问令牌 (2 分钟)

1. 访问: https://expo.dev/accounts/[your-account]/settings/access-tokens
2. 点击 **"Create Token"**
3. 复制令牌（只显示一次）

### 2️⃣ 配置 GitHub Secrets (1 分钟)

1. GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **"New repository secret"**
3. 添加:
   - Name: `EXPO_TOKEN`
   - Value: 粘贴步骤 1 的令牌
4. 点击 **"Add secret"**

### 3️⃣ 配置 EAS 项目 (1 分钟)

```bash
cd MenuApp
npm install -g eas-cli
eas login
eas build:configure
```

### 4️⃣ 提交并推送 (1 分钟)

```bash
git add .github/workflows/
git commit -m "Add CI/CD workflows"
git push
```

---

## ✅ 验证

### 检查 CI 流程

1. 访问: `https://github.com/[username]/[repo]/actions`
2. 查看 **"CI"** 工作流是否运行
3. 确认测试通过 ✅

### 检查构建流程

1. 合并代码到 `main` 分支
2. 或手动触发: **Actions** → **Build** → **Run workflow**
3. 查看构建状态: https://expo.dev/accounts/[your-account]/projects/chef-iq/builds

---

## 🎯 完成！

现在您的 CI/CD 流程已自动运行：
- ✅ 每次 Push/PR 自动运行测试
- ✅ 合并到 main 自动构建 APK
- ✅ 构建状态自动通知

---

## 📚 详细文档

- 完整设置步骤: `CI_CD_SETUP_STEPS.md`
- 实施指南: `CI_CD_IMPLEMENTATION_GUIDE.md`
- 方案评估: `CI_CD_EVALUATION.md`

---

**遇到问题？** 查看 `CI_CD_SETUP_STEPS.md` 的故障排除部分。

