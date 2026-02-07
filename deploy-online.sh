#!/bin/bash
# ============================================
# 🌐 TRY-IT! ONE-CLICK ONLINE DEPLOYMENT
# ============================================
# Usage: ./deploy-online.sh [platform]
# Platforms: vercel, railway, render, docker
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🌐 TRY-IT! AI ASSISTANT - ONLINE DEPLOYMENT 🌐       ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

PLATFORM=${1:-"menu"}

show_menu() {
    echo ""
    echo -e "${CYAN}Select deployment platform:${NC}"
    echo ""
    echo "  1) Vercel     - Best for frontend (Free tier available)"
    echo "  2) Railway    - Full-stack deployment (Free tier available)"
    echo "  3) Render     - Full-stack deployment (Free tier available)"
    echo "  4) Docker     - Self-hosted deployment"
    echo "  5) Fly.io     - Edge deployment (Free tier available)"
    echo ""
    echo -e "  ${YELLOW}0) Exit${NC}"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1) deploy_vercel ;;
        2) deploy_railway ;;
        3) deploy_render ;;
        4) deploy_docker ;;
        5) deploy_fly ;;
        0) exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}"; show_menu ;;
    esac
}

deploy_vercel() {
    echo -e "${CYAN}[Vercel]${NC} Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    echo -e "${GREEN}✅ Vercel CLI ready${NC}"
    echo ""
    echo -e "${CYAN}Starting deployment...${NC}"
    echo -e "${YELLOW}Note: You'll need to set environment variables in Vercel dashboard${NC}"
    echo ""
    
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ Deployed to Vercel!${NC}"
    echo -e "${CYAN}Set these environment variables in Vercel dashboard:${NC}"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    echo "  - VITE_API_URL"
}

deploy_railway() {
    echo -e "${CYAN}[Railway]${NC} Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Installing Railway CLI...${NC}"
        npm install -g @railway/cli
    fi
    
    echo -e "${GREEN}✅ Railway CLI ready${NC}"
    echo ""
    
    # Login to Railway
    echo -e "${CYAN}Logging in to Railway...${NC}"
    railway login
    
    # Initialize project
    echo -e "${CYAN}Initializing Railway project...${NC}"
    railway init
    
    # Deploy
    echo -e "${CYAN}Deploying...${NC}"
    railway up
    
    echo ""
    echo -e "${GREEN}✅ Deployed to Railway!${NC}"
    echo -e "${CYAN}Set environment variables with:${NC} railway variables set KEY=value"
}

deploy_render() {
    echo -e "${CYAN}[Render]${NC} Deploying to Render..."
    echo ""
    echo -e "${YELLOW}Render uses render.yaml for configuration.${NC}"
    echo ""
    echo -e "${CYAN}Steps to deploy:${NC}"
    echo "  1. Push this repo to GitHub"
    echo "  2. Go to https://render.com/deploy"
    echo "  3. Connect your GitHub repo"
    echo "  4. Render will auto-detect render.yaml"
    echo "  5. Set environment variables"
    echo "  6. Click Deploy!"
    echo ""
    echo -e "${GREEN}render.yaml is already configured ✅${NC}"
    
    # Open Render dashboard
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://dashboard.render.com/new/blueprint"
    elif command -v open &> /dev/null; then
        open "https://dashboard.render.com/new/blueprint"
    fi
}

deploy_docker() {
    echo -e "${CYAN}[Docker]${NC} Building Docker image..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed!${NC}"
        echo -e "${YELLOW}Please install Docker from https://docker.com${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker found${NC}"
    echo ""
    
    # Build image
    echo -e "${CYAN}Building image...${NC}"
    docker build -t try-it-ai .
    
    echo ""
    echo -e "${GREEN}✅ Docker image built!${NC}"
    echo ""
    echo -e "${CYAN}Run with:${NC}"
    echo "  docker run -p 3001:3001 -p 5173:5173 try-it-ai"
    echo ""
    echo -e "${CYAN}Or use docker-compose:${NC}"
    echo "  docker-compose up -d"
}

deploy_fly() {
    echo -e "${CYAN}[Fly.io]${NC} Deploying to Fly.io..."
    
    # Check if Fly CLI is installed
    if ! command -v flyctl &> /dev/null; then
        echo -e "${YELLOW}Installing Fly CLI...${NC}"
        curl -L https://fly.io/install.sh | sh
    fi
    
    echo -e "${GREEN}✅ Fly CLI ready${NC}"
    echo ""
    
    # Create fly.toml if not exists
    if [ ! -f fly.toml ]; then
        echo -e "${CYAN}Creating fly.toml...${NC}"
        cat > fly.toml << 'EOF'
app = "try-it-ai"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[services]]
  protocol = "tcp"
  internal_port = 3001
  [[services.ports]]
    port = 80
    handlers = ["http"]
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
EOF
    fi
    
    # Launch
    echo -e "${CYAN}Launching on Fly.io...${NC}"
    flyctl launch
    
    echo ""
    echo -e "${GREEN}✅ Deployed to Fly.io!${NC}"
}

# Main logic
case $PLATFORM in
    menu) show_menu ;;
    vercel) deploy_vercel ;;
    railway) deploy_railway ;;
    render) deploy_render ;;
    docker) deploy_docker ;;
    fly) deploy_fly ;;
    *) echo -e "${RED}Unknown platform: $PLATFORM${NC}"; show_menu ;;
esac
