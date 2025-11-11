#!/bin/bash

# Restart backend server script

echo "🛑 Stopping backend server..."
pkill -f "node server.js" || echo "No server running"

sleep 2

echo "🚀 Starting backend server..."
cd "$(dirname "$0")"
npm start

