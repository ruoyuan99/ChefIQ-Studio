#!/bin/bash

# React Native Debugger 连接问题修复脚本

echo "🔧 修复 React Native Debugger 连接问题..."

# 1. 停止所有 Expo 进程
echo "1. 停止所有 Expo 进程..."
killall node 2>/dev/null
sleep 2

# 2. 清理端口 8081
echo "2. 清理端口 8081..."
lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 1

# 3. 清理缓存
echo "3. 清理缓存..."
cd MenuApp
rm -rf .expo
rm -rf node_modules/.cache

# 4. 重新启动 Expo
echo "4. 重新启动 Expo..."
echo "请在新的终端窗口中运行: cd MenuApp && npx expo start --clear"
echo ""
echo "然后："
echo "1. 打开 React Native Debugger"
echo "2. 在应用中按 Cmd + D (iOS) 或 Cmd + M (Android)"
echo "3. 选择 'Debug'"

