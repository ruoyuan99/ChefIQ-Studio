#!/bin/bash

# React Native Debugger connection issue fix script

echo "🔧 Fixing React Native Debugger connection issue..."

# 1. Stop all Expo processes
echo "1. Stopping all Expo processes..."
killall node 2>/dev/null
sleep 2

# 2. Clean up port 8081
echo "2. Cleaning up port 8081..."
lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 1

# 3. Clear cache
echo "3. Clearing cache..."
cd MenuApp
rm -rf .expo
rm -rf node_modules/.cache

# 4. Restart Expo
echo "4. Restarting Expo..."
echo "Please run in a new terminal window: cd MenuApp && npx expo start --clear"
echo ""
echo "Then:"
echo "1. Open React Native Debugger"
echo "2. Press Cmd + D (iOS) or Cmd + M (Android) in the app"
echo "3. Select 'Debug'"

