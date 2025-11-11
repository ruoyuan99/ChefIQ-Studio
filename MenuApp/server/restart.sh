#!/bin/bash

# 重启后端服务器脚本

echo "🛑 停止后端服务器..."
PID=$(lsof -ti:3001 2>/dev/null | head -1)

if [ -n "$PID" ]; then
    echo "找到进程 PID: $PID"
    kill $PID
    sleep 2
    echo "✅ 服务器已停止"
else
    echo "ℹ️  没有找到运行中的服务器进程"
fi

echo ""
echo "🚀 启动后端服务器..."
npm start

