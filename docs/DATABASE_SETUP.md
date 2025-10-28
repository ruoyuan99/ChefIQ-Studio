# Supabase 数据库设置脚本

## 🚀 快速设置指南

### 1. 访问您的Supabase项目
- 项目URL: https://txendredncvrbxnxphbm.supabase.co
- 访问: https://supabase.com/dashboard/project/txendredncvrbxnxphbm

### 2. 设置数据库
1. 在Supabase仪表板中，点击左侧菜单的 **"SQL Editor"**
2. 点击 **"New query"**
3. 复制以下SQL脚本并粘贴到编辑器中：

```sql
-- Chef iQ Database Schema
-- Supabase SQL Migration Script

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 菜谱表
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cooking_time TEXT,
  servings INTEGER,
  cookware TEXT,
  is_public BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 食材表
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 步骤表
CREATE TABLE IF NOT EXISTS instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_instructions_recipe_id ON instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_instructions_step_number ON instructions(step_number);
CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_tags_recipe_id ON tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_name ON tags(tag_name);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建点赞数更新函数
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments 
  SET likes_count = likes_count + 1 
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- 启用行级安全 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 菜谱策略
CREATE POLICY "Anyone can view public recipes" ON recipes
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- 食材策略
CREATE POLICY "Anyone can view ingredients of public recipes" ON ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = ingredients.recipe_id 
      AND recipes.is_public = true
    )
  );

CREATE POLICY "Users can view ingredients of own recipes" ON ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage ingredients of own recipes" ON ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- 步骤策略
CREATE POLICY "Anyone can view instructions of public recipes" ON instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = instructions.recipe_id 
      AND recipes.is_public = true
    )
  );

CREATE POLICY "Users can view instructions of own recipes" ON instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = instructions.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage instructions of own recipes" ON instructions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = instructions.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- 评论策略
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- 评论点赞策略
CREATE POLICY "Anyone can view comment likes" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 收藏策略
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- 标签策略
CREATE POLICY "Anyone can view tags of public recipes" ON tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = tags.recipe_id 
      AND recipes.is_public = true
    )
  );

CREATE POLICY "Users can view tags of own recipes" ON tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = tags.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tags of own recipes" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = tags.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );
```

4. 点击 **"Run"** 执行SQL脚本
5. 等待执行完成，应该看到 "Success. No rows returned" 消息

### 3. 验证设置
1. 在左侧菜单点击 **"Table Editor"**
2. 您应该看到以下表：
   - users
   - recipes
   - ingredients
   - instructions
   - comments
   - comment_likes
   - favorites
   - tags

### 4. 测试连接
在您的应用中运行测试脚本：

```typescript
import { runAllTests } from './src/utils/supabaseTest'

// 在App.tsx或任何地方调用
runAllTests()
```

## 🔧 下一步
1. 运行数据库设置脚本
2. 测试Supabase连接
3. 开始迁移现有数据
4. 实现用户认证

## 📞 需要帮助？
如果遇到任何问题，请检查：
1. SQL脚本是否正确执行
2. 环境变量是否正确配置
3. 网络连接是否正常
