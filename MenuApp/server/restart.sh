#!/bin/bash

# Restart backend server script

echo "🛑 Stopping backend server..."
PID=$(lsof -ti:3001 2>/dev/null | head -1)

if [ -n "$PID" ]; then
    echo "Found process PID: $PID"
    kill $PID
    sleep 2
    echo "✅ Server stopped"
else
    echo "ℹ️  No running server process found"
fi

echo ""
echo "🚀 Starting backend server..."
npm start

