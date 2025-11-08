# 快速测试步骤

## ⚡ 5分钟快速测试

### 步骤 1: 数据库迁移（必须！）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query**
5. 打开文件 `database/add_bio_and_points_fields.sql`
6. 复制全部内容
7. 粘贴到 SQL Editor
8. 点击 **Run** 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
9. 确认显示 "Success. No rows returned"

### 步骤 2: 启动应用

```bash
cd MenuApp
npm start
```

在模拟器或真机上打开应用，登录你的账号。

### 步骤 3: 快速功能测试

#### 测试 1: 用户资料编辑（2分钟）
1. 进入 **Profile** 页面
2. 点击 **Edit Profile** 按钮
3. 修改姓名
4. 点击头像，选择一张图片
5. 点击 **Save**
6. ✅ 验证资料更新

#### 测试 2: 积分系统（2分钟）
1. 进入 **Profile** 页面，记录当前积分
2. 进入任意食谱详情页面
3. 点击 **Like** 按钮
4. 返回 **Profile** 页面
5. ✅ 验证积分增加 5 分

#### 测试 3: 评论系统（1分钟）
1. 进入任意食谱详情页面
2. 滚动到底部
3. 输入评论并发送
4. ✅ 验证评论显示

---

## 🔍 数据库验证（可选）

### 验证用户资料
1. 打开 Supabase Dashboard
2. 进入 **Table Editor** > **users**
3. 找到你的用户记录
4. ✅ 验证 `bio` 字段
5. ✅ 验证 `avatar_url` 字段
6. ✅ 验证 `total_points` 字段

### 验证积分记录
1. 进入 **Table Editor** > **user_points**
2. ✅ 验证积分记录已创建

### 验证评论
1. 进入 **Table Editor** > **comments**
2. ✅ 验证评论已创建

---

## ❌ 如果遇到问题

### 问题：头像上传失败
**解决：** 检查 Supabase Storage 权限

### 问题：积分不增加
**解决：** 确认数据库迁移脚本已执行

### 问题：评论不显示
**解决：** 检查 comments 表的 RLS 策略

---

## ✅ 测试完成

如果所有功能都正常工作，恭喜！🎉

**下一步：**
- 进行完整测试（参考 TESTING_GUIDE.md）
- 修复发现的问题
- 准备部署

---

**测试时间：** 约 5-10 分钟
**最后更新：** 2025-01-XX

