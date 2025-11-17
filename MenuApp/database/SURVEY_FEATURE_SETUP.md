# Recipe Survey Feature Setup Guide

## 概述
这个功能允许用户在点击"Tried"按钮后填写survey，收集用户对菜谱的反馈（味道、难度、是否会再次制作），并在Recipe Detail页面显示统计数据。

## 数据库设置

### 1. 执行数据库迁移
在Supabase SQL Editor中执行以下SQL脚本：

```sql
-- 文件位置: database/recipe_surveys_table.sql
```

这个脚本会：
- 创建 `recipe_surveys` 表
- 设置必要的索引
- 配置 Row Level Security (RLS) 策略
- 创建更新时间触发器

### 2. 验证表创建
执行以下查询确认表已创建：

```sql
SELECT * FROM recipe_surveys LIMIT 1;
```

## 功能说明

### Survey Modal
- 当用户第一次点击"Tried"按钮时，会弹出survey modal
- 包含3个问题：
  1. **味道是否喜欢？** (Like / Neutral / Dislike)
  2. **难度如何？** (Easy / Medium / Hard)
  3. **是否会再次制作？** (Yes / No)

### 数据存储
- Survey数据存储在Supabase的`recipe_surveys`表中
- 每个用户对每个菜谱只能提交一次survey（使用UNIQUE约束）
- 如果用户再次点击"Tried"（取消），survey数据会被删除

### 统计数据展示
- 在Recipe Detail页面的"Tried it!"按钮下方显示"Community Feedback"部分
- 显示所有用户提交的survey统计数据：
  - 味道统计（Like/Neutral/Dislike）
  - 难度统计（Easy/Medium/Hard）
  - 是否会再次制作统计（Yes/No）
- 使用进度条可视化显示各选项的比例

## 文件结构

### 新增文件
1. `src/components/RecipeSurveyModal.tsx` - Survey Modal组件
2. `src/services/recipeSurveyService.ts` - Survey数据管理服务
3. `database/recipe_surveys_table.sql` - 数据库表结构

### 修改文件
1. `src/screens/RecipeDetailScreen.tsx` - 集成survey功能

## 使用说明

### 用户流程
1. 用户在Recipe Detail页面点击"Tried it!"按钮
2. 如果是第一次点击，会弹出survey modal
3. 用户填写3个问题的答案
4. 点击"Submit"提交
5. 数据保存到数据库，菜谱标记为"已尝试"
6. Recipe Detail页面会显示该菜谱的统计数据

### 开发者注意事项
- Survey功能仅对非sample recipes生效（recipe ID不以'sample_'开头）
- 未登录用户也可以使用，但数据不会保存到数据库
- 统计数据会自动加载和更新

## 测试建议

1. **测试Survey提交**
   - 点击"Tried"按钮
   - 填写survey并提交
   - 验证数据是否正确保存

2. **测试统计数据**
   - 多个用户提交survey
   - 验证统计数据是否正确显示
   - 验证进度条是否正确显示比例

3. **测试取消Tried**
   - 点击已尝试的菜谱的"Tried"按钮
   - 验证survey数据是否被删除
   - 验证统计数据是否更新

## 故障排除

### Survey Modal不显示
- 检查`showSurveyModal` state是否正确设置
- 检查是否已经尝试过该菜谱（已尝试的不会显示modal）

### 统计数据不显示
- 检查数据库表是否已创建
- 检查RLS策略是否正确配置
- 检查是否有数据（至少需要1条survey数据才会显示）

### 数据保存失败
- 检查用户是否已登录
- 检查Supabase连接是否正常
- 查看控制台错误信息

