#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🚀 TRY-IT! AI - Starting Application               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install from https://nodejs.org"
    exit 1
fi

NODE_VER=$(node -v)
echo "✅ Node.js $NODE_VER detected"

# Check for .env
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  No .env file found! Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo ""
        echo "📝 IMPORTANT: Edit .env and add your API keys!"
        echo ""
    else
        echo "# TRY-IT! Configuration" > .env
        echo "JWT_SECRET=dev-secret-change-in-production" >> .env
        echo "PORT=3001" >> .env
        echo "✅ Created basic .env file"
    fi
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies... (this may take a minute)"
    echo ""
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠️  First install attempt failed, retrying..."
        npm cache clean --force
        npm install --legacy-peer-deps
    fi
fi

echo ""
echo "🚀 Starting development server..."
echo ""
echo "   📱 Local:   http://localhost:5173"
echo "   🌐 Network: Check console for external URL"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
