#!/bin/bash
# ============================================
# 🌍 TRY-IT! AI - ONE-CLICK DEPLOY
# Deploy to any cloud platform instantly
# ============================================
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          🌍 TRY-IT! AI - ONE-CLICK CLOUD DEPLOY              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "  Choose your deployment platform:"
echo ""
echo -e "  ${CYAN}[1]${NC} 🚀 Railway      - Best for beginners, free tier"
echo -e "  ${CYAN}[2]${NC} 🔺 Vercel       - Great for frontend, free tier"
echo -e "  ${CYAN}[3]${NC} 🟣 Render       - Full-stack friendly, free tier"
echo -e "  ${CYAN}[4]${NC} 🪁 Fly.io       - Edge deployment, generous free tier"
echo -e "  ${CYAN}[5]${NC} 🐳 Docker       - Build Docker image locally"
echo -e "  ${CYAN}[6]${NC} 📦 Build Only   - Create production build"
echo ""
read -p "  Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🚀 Deploying to Railway...${NC}"
        
        if ! command -v railway &> /dev/null; then
            echo -e "${YELLOW}Installing Railway CLI...${NC}"
            npm install -g @railway/cli
        fi
        
        echo ""
        echo -e "${YELLOW}📝 Make sure you have:${NC}"
        echo "   1. A Railway account (https://railway.app)"
        echo "   2. Set environment variables in Railway dashboard"
        echo ""
        read -p "Press Enter to continue..."
        
        railway login
        railway init
        railway up
        
        echo ""
        echo -e "${GREEN}✅ Deployed to Railway!${NC}"
        echo -e "   Open your Railway dashboard to see the URL"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}🔺 Deploying to Vercel...${NC}"
        
        if ! command -v vercel &> /dev/null; then
            echo -e "${YELLOW}Installing Vercel CLI...${NC}"
            npm install -g vercel
        fi
        
        echo ""
        echo -e "${YELLOW}📝 Note: Vercel works best for the frontend.${NC}"
        echo "   You'll need to deploy the backend separately or use Vercel Functions."
        echo ""
        read -p "Press Enter to continue..."
        
        vercel
        
        echo ""
        echo -e "${GREEN}✅ Deployed to Vercel!${NC}"
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}🟣 Deploying to Render...${NC}"
        echo ""
        echo -e "${YELLOW}📝 To deploy to Render:${NC}"
        echo "   1. Push your code to GitHub"
        echo "   2. Go to https://render.com"
        echo "   3. Create a new Web Service"
        echo "   4. Connect your repository"
        echo "   5. Use these settings:"
        echo "      - Build Command: npm install && npm run build"
        echo "      - Start Command: npm start"
        echo "   6. Add your environment variables"
        echo ""
        echo -e "${GREEN}render.yaml is already configured for you!${NC}"
        ;;
        
    4)
        echo ""
        echo -e "${BLUE}🪁 Deploying to Fly.io...${NC}"
        
        if ! command -v fly &> /dev/null; then
            echo -e "${YELLOW}Installing Fly CLI...${NC}"
            curl -L https://fly.io/install.sh | sh
            export PATH="$HOME/.fly/bin:$PATH"
        fi
        
        echo ""
        read -p "Press Enter to continue..."
        
        fly auth login
        fly launch --copy-config --yes
        
        echo ""
        echo -e "${YELLOW}Setting secrets...${NC}"
        echo "Run: fly secrets set JWT_SECRET=<your-secret> SUPABASE_URL=<url> ..."
        ;;
        
    5)
        echo ""
        echo -e "${BLUE}🐳 Building Docker image...${NC}"
        
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker not found! Install from: https://docker.com${NC}"
            exit 1
        fi
        
        docker build -t try-it-ai:latest .
        
        echo ""
        echo -e "${GREEN}✅ Docker image built!${NC}"
        echo ""
        echo "  Run locally:"
        echo -e "  ${CYAN}docker run -p 3001:3001 --env-file .env try-it-ai:latest${NC}"
        echo ""
        echo "  Push to registry:"
        echo -e "  ${CYAN}docker tag try-it-ai:latest your-registry/try-it-ai:latest${NC}"
        echo -e "  ${CYAN}docker push your-registry/try-it-ai:latest${NC}"
        ;;
        
    6)
        echo ""
        echo -e "${BLUE}📦 Building for production...${NC}"
        
        npm run build
        
        echo ""
        echo -e "${GREEN}✅ Production build complete!${NC}"
        echo ""
        echo "  Files are in the ${CYAN}dist/${NC} folder"
        echo ""
        echo "  To run production server:"
        echo -e "  ${CYAN}npm start${NC}"
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Done! 🎉${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
