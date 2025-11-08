# Supabase 设置指南

## 🚀 快速开始

### 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com)
2. 点击 "Start your project"
3. 使用GitHub账号登录
4. 创建新项目：
   - 项目名称：`chef-iq-studio`
   - 数据库密码：设置一个强密码
   - 地区：选择离您最近的地区

### 2. 获取项目配置

1. 在项目仪表板中，点击左侧菜单的 "Settings"
2. 选择 "API"
3. 复制以下信息：
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. 配置环境变量

1. 复制 `env.example` 文件为 `.env`
2. 替换其中的URL和密钥：

```bash
cp env.example .env
```

编辑 `.env` 文件：
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 设置数据库

1. 在Supabase仪表板中，点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制 `database/schema.sql` 文件中的所有内容
4. 粘贴到SQL编辑器中
5. 点击 "Run" 执行SQL脚本

### 5. 配置认证

1. 在Supabase仪表板中，点击左侧菜单的 "Authentication"
2. 选择 "Settings"
3. 配置以下设置：
   - **Site URL**: `exp://localhost:8081` (开发环境)
   - **Redirect URLs**: 添加您的应用重定向URL

### 6. 测试连接

在您的应用中测试Supabase连接：

```typescript
import { supabase } from './src/config/supabase'

// 测试连接
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('count')
    
    if (error) {
      console.error('Supabase连接失败:', error)
    } else {
      console.log('Supabase连接成功!')
    }
  } catch (err) {
    console.error('连接测试失败:', err)
  }
}
```

## 🔧 开发环境设置

### 1. 创建开发环境

1. 在Supabase中创建第二个项目用于开发
2. 项目名称：`chef-iq-studio-dev`
3. 使用相同的数据库密码

### 2. 环境变量配置

```env
# 开发环境
EXPO_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-dev-anon-key

# 生产环境
EXPO_PUBLIC_SUPABASE_URL_PROD=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD=your-prod-anon-key
```

### 3. 动态环境切换

```typescript
// config/supabase.ts
const isDev = __DEV__

const supabaseUrl = isDev 
  ? process.env.EXPO_PUBLIC_SUPABASE_URL_DEV
  : process.env.EXPO_PUBLIC_SUPABASE_URL_PROD

const supabaseKey = isDev
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV
  : process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD
```

## 📱 应用集成

### 1. 更新现有Context

将现有的AsyncStorage逻辑替换为Supabase调用：

```typescript
// contexts/RecipeContext.tsx
import { RecipeService } from '../services/supabaseService'

// 替换 AsyncStorage 调用
const getRecipes = async () => {
  try {
    const recipes = await RecipeService.getRecipes()
    setRecipes(recipes)
  } catch (error) {
    console.error('获取菜谱失败:', error)
  }
}
```

### 2. 添加认证

```typescript
// contexts/AuthContext.tsx
import { supabase } from '../config/supabase'

const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}
```

## 🔒 安全配置

### 1. 行级安全 (RLS)

数据库已经配置了RLS策略，确保：
- 用户只能访问自己的数据
- 公开菜谱可以被所有人查看
- 评论和收藏有适当的权限控制

### 2. API密钥安全

- 永远不要在客户端代码中暴露服务密钥
- 只使用anon密钥进行客户端操作
- 敏感操作应该在服务端进行

## 📊 监控和维护

### 1. 数据库监控

在Supabase仪表板中监控：
- 数据库使用量
- API请求数量
- 错误日志

### 2. 性能优化

- 使用适当的索引
- 实现分页查询
- 缓存频繁访问的数据

## 🚀 部署到生产

### 1. 生产环境设置

1. 创建生产Supabase项目
2. 配置生产环境变量
3. 设置适当的RLS策略
4. 配置备份策略

### 2. App Store配置

- 确保所有API调用使用HTTPS
- 配置适当的错误处理
- 实现离线功能降级

## 📞 支持

如果遇到问题：
1. 查看 [Supabase文档](https://supabase.com/docs)
2. 检查 [GitHub Issues](https://github.com/supabase/supabase/issues)
3. 加入 [Supabase Discord社区](https://discord.supabase.com)
