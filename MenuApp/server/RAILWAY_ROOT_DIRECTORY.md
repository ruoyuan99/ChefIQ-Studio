# Railway Root Directory 设置指南

## 📍 在哪里设置 Root Directory

### 方法 1: Railway Web 界面（推荐）

#### 步骤：

1. **登录 Railway**
   - 访问 [railway.app](https://railway.app)
   - 登录您的账户

2. **进入项目**
   - 点击您的项目（例如 "ChefIQ-Studio"）

3. **选择服务**
   - 点击创建的服务（如果没有，Railway 会自动创建一个）

4. **打开设置**
   - 点击服务名称下方的 **"Settings"** 标签
   - 或者点击服务卡片，然后点击右上角的 **"Settings"** 按钮

5. **找到 Root Directory**
   - 在 Settings 页面，向下滚动
   - 找到 **"Source"** 或 **"Deploy"** 部分
   - 查找 **"Root Directory"** 或 **"Working Directory"** 字段

6. **设置路径**
   - 在输入框中输入：`MenuApp/server`
   - 点击 **"Save"** 或 **"Update"** 按钮

#### 界面位置示例：

```
Railway Dashboard
└── Your Project
    └── Your Service
        └── Settings Tab
            └── Source Section
                └── Root Directory: [MenuApp/server]
```

### 方法 2: 使用 railway.json（已配置）

如果 Railway 界面找不到 Root Directory 选项，Railway 会自动读取 `railway.json` 配置文件。

**已创建的文件**：`MenuApp/server/railway.json`

这个文件已经包含了 Root Directory 配置：
```json
{
  "source": {
    "rootDirectory": "MenuApp/server"
  }
}
```

Railway 会自动检测这个文件并使用配置。

### 方法 3: 通过环境变量

如果以上方法都不行，可以添加环境变量：

1. 在服务页面，点击 **"Variables"** 标签
2. 添加新变量：
   - **Name**: `RAILWAY_SOURCE_DIR`
   - **Value**: `MenuApp/server`

---

## 🔍 如何确认设置成功

### 检查部署日志

1. 在服务页面，点击 **"Deployments"** 标签
2. 选择最新的部署
3. 查看 **"Logs"** 标签
4. 应该看到类似输出：
   ```
   Installing dependencies...
   Running build command: npm install
   Starting server...
   ```

如果看到错误提示找不到 `package.json` 或 `server.js`，说明 Root Directory 设置不正确。

### 正确的日志应该显示

```
✓ Installing dependencies from MenuApp/server/package.json
✓ Running: npm start
✓ Server started on port 3001
```

---

## ⚠️ 常见问题

### 问题 1: 找不到 Root Directory 选项

**可能原因**：
- Railway 界面版本不同
- 服务类型不同

**解决方案**：
1. 确保 `railway.json` 文件在仓库根目录（已创建在 `MenuApp/server/railway.json`）
2. 或者使用环境变量 `RAILWAY_SOURCE_DIR`

### 问题 2: 部署失败，找不到 package.json

**解决方案**：
1. 确认 Root Directory 设置为 `MenuApp/server`
2. 检查 `MenuApp/server/package.json` 是否存在
3. 查看部署日志确认路径

### 问题 3: 部署成功但服务器无法启动

**检查**：
1. 确认 `MenuApp/server/server.js` 存在
2. 检查环境变量是否正确设置
3. 查看日志中的错误信息

---

## 📝 完整配置检查清单

部署前确认：

- [ ] Root Directory 设置为 `MenuApp/server`（在 Railway 界面或 railway.json）
- [ ] `MenuApp/server/package.json` 存在
- [ ] `MenuApp/server/server.js` 存在
- [ ] 环境变量已设置：
  - [ ] `OPENAI_API_KEY`
  - [ ] `YOUTUBE_API_KEY`
  - [ ] `OPENAI_MODEL`（可选）
- [ ] `railway.json` 已提交到 GitHub

---

## 🎯 快速验证

部署后，测试健康检查端点：

```bash
curl https://your-app-name.up.railway.app/health
```

如果返回 `{"status":"ok","service":"Recipe Import Server"}`，说明配置正确！

---

## 💡 提示

- Railway 会自动检测 `railway.json` 文件
- 如果界面没有 Root Directory 选项，Railway 会使用配置文件
- 修改配置后，Railway 会自动重新部署

