#!/bin/bash
# ============================================
# 🚀 TRY-IT! ONE-CLICK LOCAL DEPLOYMENT
# ============================================
# Usage: ./deploy-local.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🚀 TRY-IT! AI ASSISTANT - LOCAL DEPLOYMENT 🚀        ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node is installed
echo -e "${CYAN}[1/6]${NC} Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"

# Check if npm is installed
echo -e "${CYAN}[2/6]${NC} Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}"

# Install dependencies
echo -e "${CYAN}[3/6]${NC} Installing dependencies..."
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check .env file
echo -e "${CYAN}[4/6]${NC} Checking environment variables..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found, copying from .env.example...${NC}"
    cp .env.example .env
fi
echo -e "${GREEN}✅ Environment configured${NC}"

# Build the frontend
echo -e "${CYAN}[5/6]${NC} Building frontend..."
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# Start the application
echo -e "${CYAN}[6/6]${NC} Starting Try-It!..."
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   🎉 TRY-IT! IS NOW RUNNING!                             ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   🌐 Frontend: ${CYAN}http://localhost:5173${GREEN}                   ║${NC}"
echo -e "${GREEN}║   🔧 Backend:  ${CYAN}http://localhost:3001${GREEN}                   ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Press Ctrl+C to stop                                   ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Run both frontend and backend
npm run dev
