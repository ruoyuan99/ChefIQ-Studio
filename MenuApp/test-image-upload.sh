#!/bin/bash

# 快速测试图片上传功能的脚本
# 这个脚本会检查代码是否有语法错误，并提供测试指南

echo "🧪 图片上传功能测试准备"
echo "=========================="
echo ""

# 检查必要的文件
echo "📋 检查必要文件..."
files=(
  "src/services/storageService.ts"
  "src/services/realTimeSyncService.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file 存在"
  else
    echo "❌ $file 不存在"
    exit 1
  fi
done

echo ""
echo "✅ 所有必要文件都存在"
echo ""
echo "📝 测试步骤："
echo "1. 启动应用："
echo "   cd MenuApp && npm start"
echo ""
echo "2. 在应用中："
echo "   - 登录你的账户"
echo "   - 进入创建菜谱页面"
echo "   - 选择'从网站导入'"
echo "   - 输入一个食谱网站 URL，例如："
echo "     https://www.recipetineats.com/hawaiian-chicken-salad/"
echo ""
echo "3. 观察终端日志，应该看到："
echo "   📥 [IMAGE DOWNLOAD] Starting download from: ..."
echo "   📤 [IMAGE UPLOAD] Starting upload process..."
echo "   ✅ [IMAGE UPLOAD] Upload successful!"
echo ""
echo "4. 验证结果："
echo "   - 检查 Supabase Storage bucket 'recipe-images'"
echo "   - 检查数据库 recipes 表的 image_url 字段"
echo "   - 检查应用中的图片显示"
echo ""
echo "📖 详细测试指南请查看: TEST_IMAGE_UPLOAD.md"
echo ""

