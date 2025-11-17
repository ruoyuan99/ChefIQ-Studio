#!/bin/bash

# Setup script for Chef iQ Backend Server
# This script helps set up environment variables for local development

echo "🚀 Chef iQ Backend Server - Environment Setup"
echo "=============================================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Keeping existing .env file."
        exit 1
    fi
fi

# Copy from example
if [ -f "env.example" ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
else
    echo "❌ Error: env.example file not found!"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit .env file and add your actual API keys:"
echo "   - OPENAI_API_KEY (Required for AI features)"
echo "   - YOUTUBE_API_KEY (Required for YouTube features)"
echo "   - EXPO_PUBLIC_SUPABASE_URL"
echo "   - EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY (⚠️  Keep this secret!)"
echo ""
echo "2. Get API keys:"
echo "   - OpenAI: https://platform.openai.com/api-keys"
echo "   - YouTube: https://console.cloud.google.com/apis/credentials"
echo "   - Supabase: https://app.supabase.com (Project Settings > API)"
echo ""
echo "✅ Setup complete! Don't forget to edit .env with your actual credentials."

