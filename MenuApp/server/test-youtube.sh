#!/bin/bash

echo "🧪 Testing YouTube Video Search API"
echo ""
echo "1. Testing health endpoint..."
curl -s http://localhost:3001/health | python3 -m json.tool
echo ""
echo ""
echo "2. Testing YouTube search endpoint..."
curl -s "http://localhost:3001/api/test-youtube?query=chicken%20recipe&cookware=Oven" | python3 -m json.tool
echo ""
