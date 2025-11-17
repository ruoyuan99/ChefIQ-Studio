#!/bin/bash

# Setup script for Chef iQ Recipe App
# This script helps set up environment variables for local development

echo "🚀 Chef iQ Recipe App - Environment Setup"
echo "=========================================="
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
echo "   - EXPO_PUBLIC_SUPABASE_URL"
echo "   - EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "2. Optional: Set backend URL for local development:"
echo "   - EXPO_PUBLIC_BACKEND_URL_DEV=http://YOUR_LOCAL_IP:3001"
echo ""
echo "3. Find your local IP address:"
echo "   Mac/Linux: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
echo "   Windows: ipconfig"
echo ""
echo "✅ Setup complete! Don't forget to edit .env with your actual credentials."

