#!/bin/bash

# 快速测试数据库 Schema 更改
# 使用方式: ./scripts/quick-test-schema.sh

set -e

echo "🚀 开始数据库 Schema 测试..."
echo ""

# 检查环境变量
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  警告: SUPABASE_SERVICE_ROLE_KEY 环境变量未设置"
  echo "   请设置环境变量后再运行:"
  echo "   export SUPABASE_SERVICE_ROLE_KEY=your_key"
  echo ""
  echo "   或者创建一个 .env 文件:"
  echo "   echo 'SUPABASE_SERVICE_ROLE_KEY=your_key' >> .env"
  echo ""
  
  # 检查是否有 .env 文件
  if [ -f ".env" ]; then
    echo "✅ 找到 .env 文件，尝试加载..."
    export $(cat .env | grep -v '^#' | xargs)
  else
    echo "❌ 未找到 .env 文件，退出"
    exit 1
  fi
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY 仍未设置，退出"
  exit 1
fi

echo "✅ 环境变量已设置"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安装"
  exit 1
fi

echo "✅ Node.js 已安装: $(node --version)"
echo ""

# 检查 tsx
if ! command -v npx &> /dev/null; then
  echo "❌ npx 未找到"
  exit 1
fi

echo "✅ npx 已安装"
echo ""

# 运行测试
echo "📊 运行 TypeScript 测试脚本..."
echo ""

npx tsx scripts/test-db-schema.ts

echo ""
echo "✅ 测试完成！"

