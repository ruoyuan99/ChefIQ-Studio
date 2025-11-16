# 更新生产后端到 Railway

## 🚀 快速部署步骤

### 方法 1: 通过 GitHub 自动部署（推荐）

如果您的 Railway 项目已连接到 GitHub 仓库：

1. **提交代码到 GitHub**
   ```bash
   cd "/Users/ruoyuangao/Desktop/Chef iQ RN"
   git add MenuApp/server/server.js
   git commit -m "Fix: Limit AI import tags to max 3 and ensure schema imports have empty tags"
   git push origin main
   ```

2. **Railway 会自动检测并部署**
   - Railway 会自动检测到代码推送
   - 自动开始构建和部署
   - 可以在 Railway Dashboard 中查看部署进度

3. **验证部署**
   - 访问 Railway Dashboard: https://railway.app
   - 查看 "Deployments" 标签
   - 等待部署完成（通常 2-5 分钟）

### 方法 2: 使用 Railway CLI（如果已安装）

```bash
# 安装 Railway CLI（如果未安装）
npm install -g @railway/cli

# 登录 Railway
railway login

# 进入 server 目录
cd "/Users/ruoyuangao/Desktop/Chef iQ RN/MenuApp/server"

# 链接到 Railway 项目（如果未链接）
railway link

# 部署到 Railway
railway up
```

### 方法 3: 通过 Railway Dashboard 手动部署

1. **访问 Railway Dashboard**
   - 打开 https://railway.app
   - 登录您的账户
   - 找到 "Chef iQ Studio" 或相关项目

2. **触发重新部署**
   - 进入项目
   - 点击 "Deployments" 标签
   - 点击最新的部署
   - 点击 "Redeploy" 按钮
   - 或者通过 GitHub 重新连接并触发部署

## 📋 部署前检查清单

### ✅ 代码修改确认

确保以下修改已在 `MenuApp/server/server.js` 中：

1. **Tags 限制逻辑**（AI import 最多 3 个 tags）：
   - 第 2502-2512 行：AI 响应后立即限制 tags
   - 第 478-488 行：`generateCompleteRecipeSchema` 函数内限制 tags
   - 第 2540-2552 行：返回响应前最终验证 tags

2. **Schema 导入 Tags 为空**：
   - 第 472-476 行：Schema 导入时强制 tags 为空
   - 第 2286-2289 行：在 `generateCompleteRecipeSchema` 前强制 tags 为空
   - 第 2296-2302 行：返回响应前验证 tags 为空

### ✅ 环境变量检查

确保 Railway 项目中有以下环境变量：

- `OPENAI_API_KEY` - OpenAI API 密钥（AI 功能必需）
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase URL（YouTube 缓存功能）
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `PORT` - 端口号（通常 3001，Railway 会自动设置）

## 🔍 验证部署

### 1. 检查部署日志

在 Railway Dashboard 中查看部署日志，应该看到：

```
✅ OpenAI API initialized
✅ Supabase client initialized for YouTube cache
🚀 Recipe Import Server running on port 3001
```

### 2. 测试 API 端点

部署成功后，测试以下功能：

#### 测试 Schema Import（tags 应该为空）
```bash
curl -X POST https://chefiq-studio-production.up.railway.app/api/import-recipe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.recipetineats.com/lamb-koftas-yoghurt-dressing-2/"}'
```

**期望**：
- `tags` 字段应该是空数组 `[]`
- 如果 `servings > 20`，应该返回 `null`

#### 测试 AI Import（tags 最多 3 个）
```bash
curl -X POST https://chefiq-studio-production.up.railway.app/api/optimize-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": {
      "title": "Test Recipe",
      "description": "Test",
      "ingredients": [],
      "instructions": [],
      "cookingTime": 30,
      "servings": 4,
      "tags": [],
      "cookware": null
    }
  }'
```

**期望**：
- `tags` 字段应该最多有 3 个元素
- 即使 AI 返回更多，也会被限制为 3 个

### 3. 在前端应用测试

1. **测试 Schema Import**：
   - 打开应用
   - 进入 Create Recipe 屏幕
   - 点击 "Import from Website"
   - 输入一个 recipe URL
   - 点击 "Preview" 然后 "Import"（不是 "AI Import"）
   - **验证**：Tags 应该为空

2. **测试 AI Import**：
   - 在 Create Recipe 屏幕
   - 点击 "Import from Website"
   - 输入 recipe URL
   - 点击 "Preview" 然后 "AI Import"
   - **验证**：Tags 应该最多有 3 个

## 🐛 故障排除

### 问题 1: 部署失败

**可能原因**：
- 代码语法错误
- 依赖问题
- 环境变量缺失

**解决方案**：
1. 检查 Railway 部署日志中的错误信息
2. 确认 `package.json` 中的依赖都正确
3. 确认所有必需的环境变量都已设置

### 问题 2: 部署成功但功能未更新

**可能原因**：
- 构建缓存
- 前端缓存
- 后端代码未正确推送

**解决方案**：
1. 在 Railway Dashboard 中清除构建缓存
2. 重新触发部署
3. 在前端应用中清除缓存并重新加载

### 问题 3: Tags 仍然超过 3 个

**可能原因**：
- 前端缓存
- 后端代码未正确部署

**解决方案**：
1. 检查 Railway 部署日志，确认代码已更新
2. 在前端应用中清除缓存并重新加载（按 `r` 键或重启应用）
3. 检查前端控制台日志，应该看到 tags 限制的日志

## 📝 部署后的验证步骤

1. ✅ **后端日志检查**
   - 查看 Railway Dashboard 中的日志
   - 确认看到 `📋 AI import - Final tags (max 3): [...]` 日志

2. ✅ **前端日志检查**
   - 在应用控制台中
   - 确认看到 `⚠️ Backend returned X tags, limiting to 3: [...]` 日志（如果后端返回超过 3 个）

3. ✅ **功能测试**
   - Schema import: tags 为空 ✅
   - AI import: tags 最多 3 个 ✅
   - Servings > 20: 显示为空 ✅

## 🎯 快速部署命令

如果您使用 Git 工作流：

```bash
# 1. 进入项目根目录
cd "/Users/ruoyuangao/Desktop/Chef iQ RN"

# 2. 检查修改的文件
git status

# 3. 添加修改的文件
git add MenuApp/server/server.js

# 4. 提交修改
git commit -m "Fix: Limit AI import tags to max 3, ensure schema imports have empty tags"

# 5. 推送到 GitHub（如果 Railway 连接到 GitHub，会自动部署）
git push origin main

# 6. 等待部署完成（2-5 分钟）
# 在 Railway Dashboard 中查看部署状态
```

## 📞 需要帮助？

如果遇到问题：
1. 查看 Railway Dashboard 中的部署日志
2. 检查环境变量是否正确设置
3. 确认代码修改已正确提交
4. 测试本地后端（`npm start`）确认功能正常

