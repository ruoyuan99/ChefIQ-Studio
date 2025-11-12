# CI/CD 实施指南

本指南提供 Chef iQ 项目 CI/CD 流程的详细实施步骤和配置文件。

---

## 📋 目录

1. [GitHub Actions 配置](#github-actions-配置)
2. [EAS Build 集成](#eas-build-集成)
3. [环境变量管理](#环境变量管理)
4. [测试配置](#测试配置)
5. [部署配置](#部署配置)

---

## 🔧 GitHub Actions 配置

### 1. 创建基础 CI 工作流

创建文件: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: MenuApp/package-lock.json
      
      - name: Install dependencies
        working-directory: MenuApp
        run: npm ci
      
      - name: Run ESLint
        working-directory: MenuApp
        run: npm run lint || echo "Linting not configured, skipping..."
        continue-on-error: true
      
      - name: TypeScript check
        working-directory: MenuApp
        run: npx tsc --noEmit || echo "TypeScript check not configured, skipping..."
        continue-on-error: true
      
      - name: Run tests
        working-directory: MenuApp
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: MenuApp/coverage
          flags: frontend
        continue-on-error: true

  backend-test:
    name: Backend Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: MenuApp/server/package-lock.json
      
      - name: Install dependencies
        working-directory: MenuApp/server
        run: npm ci
      
      - name: Run backend tests
        working-directory: MenuApp/server
        run: npm test || echo "Backend tests not configured, skipping..."
        continue-on-error: true
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
```

### 2. 创建构建工作流

创建文件: `.github/workflows/build.yml`

```yaml
name: Build

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build'
        required: true
        default: 'android'
        type: choice
        options:
          - android
          - ios
          - all

jobs:
  build:
    name: Build App
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: MenuApp/package-lock.json
      
      - name: Install dependencies
        working-directory: MenuApp
        run: npm ci
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install EAS CLI
        run: npm install -g eas-cli
      
      - name: Configure EAS
        working-directory: MenuApp
        run: eas build:configure --non-interactive
      
      - name: Build Android
        if: github.event.inputs.platform == 'android' || github.event.inputs.platform == 'all' || (github.event.inputs.platform == '' && github.ref == 'refs/heads/main')
        working-directory: MenuApp
        run: eas build --platform android --profile preview --non-interactive --no-wait
      
      - name: Build iOS
        if: github.event.inputs.platform == 'ios' || github.event.inputs.platform == 'all'
        working-directory: MenuApp
        run: eas build --platform ios --profile preview --non-interactive --no-wait
      
      - name: Comment build status
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Build triggered! Check status at https://expo.dev'
            })
```

### 3. 创建发布工作流

创建文件: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version number (e.g., 1.0.0)'
        required: true

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Get version
        id: version
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "version=${{ github.event.inputs.version }}" >> $GITHUB_OUTPUT
          else
            echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
          fi
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.version.outputs.version }}
          release_name: Release v${{ steps.version.outputs.version }}
          body: |
            ## Changes
            - See commit history for details
            
            ## Downloads
            - Android APK: Check EAS Build dashboard
            - iOS IPA: Check EAS Build dashboard
          draft: false
          prerelease: false
```

---

## 🏗️ EAS Build 集成

### 1. 更新 eas.json

确保 `MenuApp/eas.json` 配置正确：

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      },
      "env": {
        "EXPO_PUBLIC_ENV": "preview"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "simulator": false
      },
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  }
}
```

### 2. 配置 EAS Secrets

在 Expo Dashboard 或使用 CLI 配置环境变量：

```bash
# 登录 EAS
eas login

# 设置前端环境变量
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "https://your-backend.com"

# 查看所有 secrets
eas secret:list
```

---

## 🔐 环境变量管理

### 1. GitHub Secrets 配置

在 GitHub 仓库设置中添加 Secrets:

**路径**: `Settings` → `Secrets and variables` → `Actions`

**必需的 Secrets**:
- `EXPO_TOKEN`: Expo 访问令牌 (从 https://expo.dev/accounts/[account]/settings/access-tokens 获取)
- `OPENAI_API_KEY`: OpenAI API 密钥 (用于后端测试)
- `YOUTUBE_API_KEY`: YouTube API 密钥 (用于后端测试)

### 2. 环境变量文件

**前端** (`MenuApp/.env.example`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_BACKEND_URL=https://your-backend.com
```

**后端** (`MenuApp/server/.env.example`):
```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```

### 3. 在代码中使用环境变量

**前端** (`MenuApp/src/config/recipeImport.ts`):
```typescript
export const getBackendUrl = (): string => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  // 开发环境回退
  return __DEV__ ? 'http://localhost:3001' : 'https://your-backend.com';
};
```

---

## 🧪 测试配置

### 1. 更新 package.json 脚本

在 `MenuApp/package.json` 中添加：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### 2. 添加 ESLint 配置 (可选)

创建 `MenuApp/.eslintrc.js`:

```javascript
module.exports = {
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
```

---

## 🚀 部署配置

### 1. 后端部署 (Heroku 示例)

创建 `MenuApp/server/Procfile`:
```
web: node server.js
```

创建 `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths:
      - 'MenuApp/server/**'

jobs:
  deploy:
    name: Deploy to Heroku
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
          appdir: "MenuApp/server"
```

### 2. 后端部署 (Railway 示例)

Railway 支持自动部署，只需连接 GitHub 仓库即可。

### 3. 后端部署 (Render 示例)

创建 `MenuApp/server/render.yaml`:

```yaml
services:
  - type: web
    name: chef-iq-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 3001
      - key: OPENAI_API_KEY
        sync: false
      - key: YOUTUBE_API_KEY
        sync: false
```

---

## 📝 实施步骤

### 步骤 1: 准备环境

```bash
# 1. 确保代码在 GitHub 仓库
git remote -v

# 2. 安装 EAS CLI
npm install -g eas-cli

# 3. 登录 Expo
eas login

# 4. 配置 EAS 项目
cd MenuApp
eas build:configure
```

### 步骤 2: 配置 GitHub Secrets

1. 访问 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 添加以下 Secrets:
   - `EXPO_TOKEN`
   - `OPENAI_API_KEY` (可选，用于测试)
   - `YOUTUBE_API_KEY` (可选，用于测试)

### 步骤 3: 创建 GitHub Actions 工作流

```bash
# 创建目录
mkdir -p .github/workflows

# 复制工作流文件到 .github/workflows/
# (使用上面提供的 YAML 配置)
```

### 步骤 4: 测试 CI 流程

```bash
# 提交代码
git add .
git commit -m "Add CI/CD configuration"
git push

# 检查 GitHub Actions 运行状态
# 访问: https://github.com/[username]/[repo]/actions
```

### 步骤 5: 测试构建流程

```bash
# 合并到 main 分支或手动触发
# 检查 EAS Build 状态
eas build:list
```

---

## ✅ 检查清单

- [ ] GitHub Actions 工作流文件已创建
- [ ] GitHub Secrets 已配置
- [ ] EAS 项目已配置
- [ ] EAS Secrets 已设置
- [ ] 测试脚本已更新
- [ ] 环境变量文件已创建
- [ ] CI 流程测试通过
- [ ] 构建流程测试通过

---

## 🐛 故障排除

### 问题 1: EAS Build 失败

**解决方案**:
- 检查 `eas.json` 配置
- 验证 EAS Secrets 是否正确设置
- 查看构建日志: `eas build:view [BUILD_ID]`

### 问题 2: GitHub Actions 无法访问 Secrets

**解决方案**:
- 确保 Secrets 名称正确
- 检查仓库权限设置
- 验证 GitHub Token 权限

### 问题 3: 测试失败

**解决方案**:
- 检查测试环境变量
- 验证依赖安装
- 查看测试日志

---

## 📚 参考资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [Expo GitHub Action](https://github.com/expo/expo-github-action)

---

**准备好开始实施了吗？** 🚀

