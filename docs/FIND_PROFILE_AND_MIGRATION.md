# 🔍 检查Profile和Data Migration功能

## 📱 如何找到Profile和Data Migration

### 第1步：打开应用
访问：http://localhost:8083

### 第2步：登录应用
- 如果没有账户，先注册
- 如果有账户，直接登录

### 第3步：找到Profile功能
在应用底部导航栏，您会看到5个标签：
1. **Favorite** (收藏) - 书签图标
2. **Explore** (探索) - 日历图标  
3. **+** (创建) - 加号图标（中间）
4. **Groceries** (购物清单) - 购物车图标
5. **More** (更多) - 菜单图标 ← **这就是Profile！**

### 第4步：进入Profile页面
1. 点击底部的 **"More"** 标签（最右边的菜单图标）
2. 您会看到个人资料页面，包含：
   - 用户头像和姓名
   - 积分显示
   - 菜单列表

### 第5步：找到Data Migration
在Profile页面的菜单列表中，您会看到：
- Supabase Test
- **Data Migration** ← 点击这个！
- Settings
- Help & Support
- About
- Sign Out

---

## 🎯 快速测试步骤

1. **打开应用** → http://localhost:8083
2. **登录** → 注册或登录账户
3. **点击底部"More"** → 最右边的菜单图标
4. **点击"Data Migration"** → 云上传图标
5. **查看迁移页面** → 应该显示用户状态和数据概览

---

## ❓ 如果看不到这些功能

### 问题1：看不到底部导航
- 确认已登录
- 刷新页面重试

### 问题2：看不到"More"标签
- 检查应用是否完全加载
- 确认在HomeScreen中

### 问题3：看不到"Data Migration"菜单
- 确认在Profile页面
- 向下滚动查看完整菜单

### 问题4：点击Data Migration没反应
- 检查控制台是否有错误
- 确认导航配置正确

---

## 🔧 调试信息

如果功能不工作，请检查：

1. **浏览器控制台**是否有错误
2. **网络请求**是否正常
3. **用户认证**是否成功
4. **导航路由**是否正确注册

---

**Profile = More标签，Data Migration在Profile菜单中！** 🎯
