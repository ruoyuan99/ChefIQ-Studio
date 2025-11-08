# Recipe Import from Website Guide

## 功能概述

这个功能允许用户通过输入食谱网站 URL，自动导入食谱信息到 Chef iQ Studio 应用中。

## 技术方案

### 方案 1: Schema.org Recipe 结构化数据解析（当前实现）

**原理：**
- 大多数主流食谱网站（如 RecipeTin Eats, AllRecipes, Food Network 等）使用 [Schema.org Recipe](https://schema.org/Recipe) 结构化数据
- 网站会在 HTML 中嵌入 JSON-LD 格式的食谱信息
- 我们的解析器提取这些结构化数据并转换为应用格式

**优点：**
- ✅ 免费
- ✅ 标准化格式，准确度高
- ✅ 支持大多数主流食谱网站

**限制：**
- ⚠️ 需要网站支持 Schema.org
- ⚠️ 可能遇到 CORS 限制（建议使用后端代理）

### 方案 2: 第三方 Recipe API（推荐用于生产环境）

**推荐的 API 服务：**
1. **Recipe Parser API** - https://www.recipeparser.com/
   - 提供免费和付费计划
   - 支持 1000+ 食谱网站
   - 高准确度

2. **ScrapingBee Recipe Parser** - https://www.scrapingbee.com/
   - 专业网页抓取服务
   - 处理反爬虫机制

**使用方法：**
```typescript
import { importRecipeFromAPI } from '../services/recipeImportService';

const recipe = await importRecipeFromAPI(
  'https://www.recipetineats.com/chicken-chasseur/',
  'YOUR_API_KEY'
);
```

### 方案 3: 后端代理服务（✅ 当前实现）

**为什么需要后端：**
1. ✅ 避免 CORS 限制
2. ✅ 处理反爬虫机制
3. ✅ 缓存和性能优化
4. ✅ 更好的错误处理
5. ✅ 支持所有设备（iOS、Android、Web）

**实现状态：**
✅ 后端服务器已创建在 `server/` 目录
✅ 前端已集成后端 API 调用
✅ 支持开发和生产环境配置

**快速启动：**

1. **安装依赖：**
```bash
cd server
npm install
```

2. **启动服务器：**
```bash
npm run dev  # 开发模式（自动重启）
# 或
npm start    # 生产模式
```

3. **服务器将在 `http://localhost:3001` 启动**

4. **测试服务器：**
```bash
curl http://localhost:3001/health
```

**配置说明：**

- 开发环境：自动使用 `localhost:3001`（iOS）或 `10.0.2.2:3001`（Android 模拟器）
- 生产环境：在 `src/config/recipeImport.ts` 中配置生产 URL

**部署到生产环境：**

部署到以下任一平台：
- **Heroku**: `heroku create && git push heroku main`
- **Railway**: 连接 GitHub 仓库自动部署
- **Render**: 创建 Web Service 并连接仓库
- **DigitalOcean**: 使用 App Platform

部署后，更新 `src/config/recipeImport.ts` 中的 `PROD_BACKEND_URL`。

详细说明请查看 `server/README.md` 和 `server/QUICK_START.md`。

## 使用方法

### 在应用中导入食谱

1. 打开 **Create Recipe** 页面
2. 点击 **"Import from URL"** 按钮（在 Recipe Information 标题旁边）
3. 输入食谱 URL（例如：`https://www.recipetineats.com/chicken-chasseur/`）
4. 点击 **Preview** 预览导入的内容
5. 点击 **Import** 导入到表单
6. 检查并编辑导入的内容
7. 保存或发布食谱

## 支持的数据字段

导入功能会自动提取以下信息：

- ✅ **Title** - 食谱标题
- ✅ **Description** - 食谱描述
- ✅ **Image** - 食谱图片 URL
- ✅ **Ingredients** - 食材列表（名称、数量、单位）
- ✅ **Instructions** - 制作步骤
- ✅ **Cooking Time** - 烹饪时间
- ✅ **Servings** - 份量
- ✅ **Tags/Keywords** - 标签和关键词

## 支持的网站

理论上支持所有使用 Schema.org Recipe 格式的网站，包括：

- ✅ RecipeTin Eats
- ✅ AllRecipes
- ✅ Food Network
- ✅ BBC Good Food
- ✅ Serious Eats
- ✅ Tasty
- 以及更多...

## 故障排除

### 问题：CORS 错误

**解决方案：**
- 使用后端代理服务（方案 3）
- 或使用第三方 API（方案 2）

### 问题：无法解析食谱

**可能原因：**
1. 网站不支持 Schema.org 格式
2. 网站结构发生变化
3. 需要登录或验证

**解决方案：**
1. 检查网站是否使用标准格式
2. 手动输入食谱信息
3. 使用第三方解析 API

### 问题：图片无法加载

**解决方案：**
- 导入后手动上传图片
- 或使用图片下载服务

## 未来改进

- [ ] 添加图片自动下载功能
- [ ] 支持更多食谱格式（Microdata, RDFa）
- [ ] 添加食谱验证和清理功能
- [ ] 支持批量导入
- [ ] 添加导入历史记录

## 相关文件

- `src/services/recipeImportService.ts` - 导入服务逻辑
- `src/components/ImportRecipeModal.tsx` - 导入 UI 组件
- `src/screens/CreateRecipeScreen.tsx` - 集成导入功能

## 参考资源

- [Schema.org Recipe](https://schema.org/Recipe)
- [Recipe Parser API](https://www.recipeparser.com/)
- [JSON-LD Specification](https://json-ld.org/)

