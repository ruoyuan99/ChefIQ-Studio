# 测试本地生成UUID功能

## 测试步骤

### 1. 启动应用
应用正在后台运行，等待 Metro bundler 启动完成。

### 2. 测试场景

#### 场景A：创建新菜谱
1. 打开应用并登录
2. 进入"Create Recipe"页面
3. 填写菜谱信息（标题、描述、食材、步骤等）
4. 点击"Publish"
5. **预期结果**：
   - 菜谱应该立即发布，没有延迟
   - 导航到 Recipe Detail 页面，应该显示正确的菜谱
   - **不应出现"Recipe not found"错误**

#### 场景B：从网站导入菜谱
1. 打开应用并登录
2. 进入"Import Recipe"页面
3. 选择"Import from URL"
4. 输入一个菜谱URL（例如：https://www.jewishfoodsociety.org/recipes/german-potato-salad-with-fresh-herbs）
5. 等待导入完成
6. 编辑并发布菜谱
7. **预期结果**：
   - 菜谱应该立即发布
   - 导航到 Recipe Detail 页面，应该显示正确的菜谱
   - **不应出现"Recipe not found"错误**

#### 场景C：AI生成菜谱
1. 打开应用并登录
2. 进入"Generate from Ingredients"页面
3. 输入食材并生成菜谱
4. 选择一个生成的菜谱
5. 发布菜谱
6. **预期结果**：
   - 菜谱应该立即发布
   - 导航到 Recipe Detail 页面，应该显示正确的菜谱
   - **不应出现"Recipe not found"错误**

### 3. 检查日志

在控制台/终端中查看以下日志，确认UUID生成和使用正确：

#### 期望看到的日志：
```
✅ RecipeContext - Adding recipe with UUID: { id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", ... }
✅ 🆕 使用本地生成的 UUID 创建 recipe: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ 🆕 Recipe inserted with id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ 同步完成，数据库recipe ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ 🧭 Navigating with UUID (no ID update needed): { recipeId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", isUUID: true, ... }
```

#### 不应看到的日志：
- ❌ `🔄 更新本地recipe ID:` - 因为ID已经是UUID，不需要更新
- ❌ `⚠️ 数据库返回的ID与本地UUID不一致` - 数据库应该使用本地UUID
- ❌ `❌ Recipe not found` - 应该能找到菜谱

### 4. 验证数据库

在 Supabase Dashboard 中检查：

1. 打开 Supabase Dashboard → Table Editor → recipes
2. 查找最新创建的菜谱
3. **验证点**：
   - `id` 字段应该是有效的UUID格式（例如：`7fb86d12-52f3-469b-8135-8c4d200827bd`）
   - 不应该看到时间戳格式的ID（例如：`1763279975512`）
   - 本地生成的UUID应该与数据库中的UUID完全一致

### 5. 问题排查

如果遇到问题：

#### 问题1：应用启动失败
- 检查 `expo-crypto` 是否已安装：`npm list expo-crypto`
- 如果未安装，运行：`npm install expo-crypto`

#### 问题2：仍然出现"Recipe not found"
- 检查日志中UUID格式是否正确
- 确认 `realTimeSyncService.ts` 中是否正确设置了 `insertData.id`
- 检查数据库插入是否成功

#### 问题3：数据库ID与本地UUID不一致
- 检查 Supabase 是否有触发器修改了ID
- 检查是否有 RLS 策略影响插入

## 测试清单

- [ ] 创建新菜谱可以正常发布并导航
- [ ] 从网站导入菜谱可以正常发布并导航
- [ ] AI生成菜谱可以正常发布并导航
- [ ] 日志显示UUID正确生成和使用
- [ ] 数据库中的ID是UUID格式
- [ ] 本地UUID与数据库UUID一致
- [ ] 没有"Recipe not found"错误
- [ ] 没有ID更新相关的警告

## 预期改进

使用本地生成UUID后：
- ✅ 不再需要等待ID更新
- ✅ 立即导航到Recipe Detail页面
- ✅ 消除ID同步问题
- ✅ 更可靠的导航逻辑
- ✅ 更简单的代码维护

