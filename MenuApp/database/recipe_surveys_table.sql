-- Recipe Surveys Table
-- 用于存储用户对菜谱的survey反馈

CREATE TABLE IF NOT EXISTS recipe_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  taste TEXT NOT NULL CHECK (taste IN ('like', 'neutral', 'dislike')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  will_make_again TEXT NOT NULL CHECK (will_make_again IN ('yes', 'no')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id) -- 每个用户对每个菜谱只能提交一次survey
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_recipe_surveys_recipe_id ON recipe_surveys(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_surveys_user_id ON recipe_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_surveys_created_at ON recipe_surveys(created_at);

-- 创建更新时间触发器
CREATE TRIGGER update_recipe_surveys_updated_at
  BEFORE UPDATE ON recipe_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用 Row Level Security (RLS)
ALTER TABLE recipe_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 用户可以查看所有公开的survey数据（用于统计）
CREATE POLICY "Users can view all recipe surveys for statistics"
  ON recipe_surveys FOR SELECT
  USING (true);

-- 用户可以插入自己的survey
CREATE POLICY "Users can insert their own surveys"
  ON recipe_surveys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的survey
CREATE POLICY "Users can update their own surveys"
  ON recipe_surveys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的survey
CREATE POLICY "Users can delete their own surveys"
  ON recipe_surveys FOR DELETE
  USING (auth.uid() = user_id);

