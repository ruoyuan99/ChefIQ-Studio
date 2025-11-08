# 应用内测试指南 - Recipe Import

## 准备工作

### ✅ 后端服务器状态
- **状态**: 运行中
- **地址**: `http://localhost:3001`
- **健康检查**: ✅ 通过

### ✅ React Native 应用
- **状态**: 运行中（Expo）

## 测试步骤

### 1. 打开应用
确保你的 React Native 应用正在运行：
- iOS 模拟器
- Android 模拟器
- 或真实设备

### 2. 导航到 Create Recipe 页面
- 从主界面导航到创建食谱页面
- 或直接点击创建新食谱的按钮

### 3. 使用导入功能
1. 在 "Recipe Information" 部分，找到 **"Import from URL"** 按钮（橙色按钮，带下载图标）
2. 点击按钮打开导入模态框
3. 在输入框中输入测试 URL：
   ```
   https://www.recipetineats.com/chicken-chasseur/
   ```
4. 点击 **Preview** 按钮预览导入的内容
5. 如果预览成功，点击 **Import** 按钮导入到表单

### 4. 检查导入结果
导入成功后，你应该看到：
- ✅ 标题: "Chicken Chasseur"
- ✅ 描述: 完整的食谱描述
- ✅ 图片: 食谱图片 URL
- ✅ 食材: 19 个食材已填充
- ✅ 步骤: 4 个制作步骤已填充
- ✅ 烹饪时间: "60 minutes"
- ✅ 份量: "4 servings"
- ✅ 标签: 3 个标签

### 5. 编辑和保存
- 检查并编辑导入的内容（如果需要）
- 点击 "Publish" 或 "Save as Draft" 保存食谱

## 故障排除

### 问题 1: 无法连接到后端服务器

**iOS 模拟器:**
- ✅ 应该正常工作（使用 `localhost:3001`）
- 如果失败，检查服务器是否在运行

**Android 模拟器:**
- ✅ 应该正常工作（自动使用 `10.0.2.2:3001`）
- 如果失败，检查服务器是否在运行

**真实设备 (iOS/Android):**
- ⚠️ 需要修改配置使用计算机的局域网 IP
- 查看下方 "真实设备配置" 部分

### 问题 2: 网络错误 (Network request failed)

**可能原因:**
1. 后端服务器未运行
2. 防火墙阻止连接
3. 真实设备需要局域网 IP

**解决方案:**
1. 确认服务器运行: `curl http://localhost:3001/health`
2. 检查防火墙设置
3. 对于真实设备，使用局域网 IP（见下方）

### 问题 3: 导入失败或返回错误

**检查:**
1. URL 是否正确
2. 网站是否支持 Schema.org Recipe 格式
3. 查看应用控制台日志

## 真实设备配置（如果需要）

如果你的应用在真实设备上运行，需要修改配置以使用计算机的局域网 IP：

### 1. 获取计算机的局域网 IP

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig | findstr IPv4
```

示例 IP: `192.168.1.100`

### 2. 临时修改配置

编辑 `src/config/recipeImport.ts`:

```typescript
const getDevBackendUrl = (): string => {
  // 使用你的计算机局域网 IP
  return 'http://192.168.1.100:3001'; // 替换为你的 IP
};
```

### 3. 重启应用

重新加载应用以使配置生效。

## 测试检查清单

- [ ] 后端服务器正在运行
- [ ] React Native 应用正在运行
- [ ] 能够打开 Create Recipe 页面
- [ ] 能看到 "Import from URL" 按钮
- [ ] 能够打开导入模态框
- [ ] 能够输入 URL
- [ ] Preview 功能正常工作
- [ ] Import 功能正常工作
- [ ] 数据正确填充到表单
- [ ] 能够保存导入的食谱

## 预期结果

成功导入后，表单应该包含：
- **标题**: Chicken Chasseur
- **描述**: 完整的食谱描述
- **图片**: 食谱图片 URL
- **食材**: 19 个食材项
- **步骤**: 4 个详细步骤
- **烹饪时间**: 60 minutes
- **份量**: 4 servings
- **标签**: French, Hunter's chicken 等

## 需要帮助？

如果遇到问题：
1. 检查后端服务器日志
2. 检查应用控制台日志
3. 确认网络连接正常
4. 验证 URL 格式正确

