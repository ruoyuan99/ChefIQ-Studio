#!/bin/bash

# Quick test script for AI-enhanced YouTube search
# Usage: ./test-youtube-quick.sh

BACKEND_URL="http://localhost:3001"

echo "🚀 Testing AI-enhanced YouTube search..."
echo "📍 Backend URL: $BACKEND_URL"
echo ""

# Test 1: Simple query with cookware
echo "🧪 Test 1: Simple query with cookware"
curl -s "${BACKEND_URL}/api/test-youtube?query=Chicken%20Stir%20Fry&cookware=Stovetop" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Full recipe data
echo "🧪 Test 2: Full recipe data"
curl -s "${BACKEND_URL}/api/test-youtube?title=Chicken%20and%20Tofu%20Stir%20Fry&description=Quick%20and%20easy%20stir%20fry&ingredients=chicken,tofu,soy%20sauce&cookware=Stovetop&cuisine=Chinese&cookingTime=20%20minutes" | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Chocolate Pudding
echo "🧪 Test 3: Chocolate Pudding"
curl -s "${BACKEND_URL}/api/test-youtube?title=Chocolate%20Pudding%20Pots&description=Rich%20and%20creamy%20chocolate%20pudding&ingredients=dark%20chocolate,heavy%20cream,sugar&cookware=Oven&cuisine=Dessert&cookingTime=30%20minutes" | jq '.'
echo ""

echo "✅ Tests completed!"
echo ""
echo "💡 Check the 'searchQueryUsed' field to see the AI-optimized search query"
echo "💡 Compare with basic query format: '{title} {cookware} recipe'"

