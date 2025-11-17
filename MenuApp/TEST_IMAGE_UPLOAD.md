# 测试图片上传功能

本文档说明如何测试从网站导入菜谱时，图片自动下载并上传到 Supabase Storage 的功能。

## 测试步骤

### 1. 准备测试环境

确保：
- ✅ 应用已连接到 Supabase
- ✅ 用户已登录
- ✅ 网络连接正常
- ✅ Supabase Storage bucket `recipe-images` 已创建并配置

### 2. 测试从网站导入菜谱

1. **打开应用**，进入创建菜谱页面
2. **选择"从网站导入"**功能
3. **输入一个包含图片的食谱网站 URL**，例如：
   - `https://www.recipetineats.com/hawaiian-chicken-salad/`
   - 或其他任何包含食谱的网站

4. **等待导入完成**

### 3. 观察日志输出

在终端或开发工具中，你应该看到以下日志：

#### 导入阶段
```
📥 [IMAGE DOWNLOAD] Starting download from: https://...
📥 [IMAGE DOWNLOAD] Saving to local path: file://...
✅ [IMAGE DOWNLOAD] Remote image downloaded successfully
   - Local path: file://...
   - File size: ... bytes
```

#### 上传阶段
```
📤 [IMAGE UPLOAD] Starting upload process
   - Source: https://... (或 file://...)
   - Owner ID: ...
   - Compress: true
📤 [IMAGE UPLOAD] Detected remote URL, downloading first...
📤 [IMAGE UPLOAD] Reading file as base64...
📤 [IMAGE UPLOAD] File read, size: ... bytes
📤 [IMAGE UPLOAD] Uploading to Supabase Storage...
✅ [IMAGE UPLOAD] Upload successful!
   - Public URL: https://...supabase.co/storage/v1/object/public/recipe-images/recipes/.../...
```

#### 同步阶段
```
🔄 [SYNC] Starting image upload process...
   - Source type: Remote URL (will download first)
✅ [SYNC] Recipe image uploaded successfully to our storage
   - New URL: https://...supabase.co/storage/v1/object/public/recipe-images/recipes/.../...
   - Upload duration: ... ms
```

### 4. 验证结果

#### 方法 1: 检查数据库
1. 打开 Supabase Dashboard
2. 进入 **Storage** > **recipe-images** bucket
3. 检查 `recipes/{userId}/` 文件夹
4. 应该能看到新上传的图片文件

#### 方法 2: 检查数据库记录
1. 打开 Supabase Dashboard
2. 进入 **Table Editor** > **recipes** 表
3. 找到刚导入的菜谱
4. 检查 `image_url` 字段
5. 应该是一个 Supabase Storage 的 URL（包含 `supabase.co/storage`）

#### 方法 3: 检查应用显示
1. 在 **My Recipes** 列表中查看菜谱卡片
2. 图片应该正常显示
3. 进入 **Recipe Detail** 页面
4. 主图应该正常显示
5. 图片 URL 应该是 Supabase Storage 的 URL

### 5. 验证图片持久性

1. **断开网络连接**（或使用飞行模式）
2. **查看已导入的菜谱**
3. 图片应该仍然正常显示（因为已存储在 Supabase Storage）

## 预期行为

### ✅ 成功情况

- 远程图片被下载到本地临时文件
- 图片被压缩（如果启用）
- 图片被上传到 Supabase Storage
- 数据库中的 `image_url` 字段更新为 Supabase Storage URL
- 应用中的所有位置都能正常显示图片

### ⚠️ 失败情况处理

如果上传失败，系统会：
1. 记录错误日志
2. 回退到使用原始 URL（如果存在）
3. 继续保存菜谱（不会因为图片上传失败而阻止保存）

## 常见问题排查

### 问题 1: 图片下载失败

**症状：** 日志显示 `❌ [IMAGE DOWNLOAD] Failed to download remote image`

**可能原因：**
- 网络连接问题
- 图片 URL 无效或已失效
- 网站阻止了下载请求

**解决方案：**
- 检查网络连接
- 尝试其他食谱网站
- 查看详细错误日志

### 问题 2: 图片上传失败

**症状：** 日志显示 `❌ [IMAGE UPLOAD] Upload error`

**可能原因：**
- Supabase Storage 配置问题
- 权限问题（RLS 策略）
- 文件大小限制

**解决方案：**
- 检查 Supabase Storage bucket 配置
- 检查 RLS 策略是否允许上传
- 检查文件大小是否超过限制

### 问题 3: 图片显示为占位图

**症状：** 应用显示占位图而不是实际图片

**可能原因：**
- 图片 URL 格式不正确
- Supabase Storage URL 无法访问
- 图片加载组件问题

**解决方案：**
- 检查数据库中的 `image_url` 字段
- 在浏览器中直接访问图片 URL 验证
- 检查图片加载组件的日志

## 测试检查清单

- [ ] 从网站导入菜谱成功
- [ ] 日志显示图片下载过程
- [ ] 日志显示图片上传过程
- [ ] Supabase Storage 中有新图片文件
- [ ] 数据库 `image_url` 字段是 Supabase Storage URL
- [ ] My Recipes 列表中图片正常显示
- [ ] Recipe Detail 页面图片正常显示
- [ ] 断开网络后图片仍能显示（验证持久性）

## 性能指标

正常情况下：
- 图片下载时间：1-5 秒（取决于图片大小和网络速度）
- 图片压缩时间：0.5-2 秒
- 图片上传时间：2-10 秒（取决于图片大小和网络速度）
- 总耗时：约 3-17 秒

如果耗时过长，可能需要：
- 检查网络速度
- 优化图片压缩设置
- 检查 Supabase Storage 性能

