@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================
:: 🌍 TRY-IT! AI - ONE-CLICK DEPLOY (Windows)
:: ============================================

title Try-It! AI Deployer
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║          🌍 TRY-IT! AI - ONE-CLICK CLOUD DEPLOY              ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo   Choose your deployment platform:
echo.
echo   [1] 🚀 Railway      - Best for beginners, free tier
echo   [2] 🔺 Vercel       - Great for frontend, free tier
echo   [3] 🟣 Render       - Full-stack friendly, free tier
echo   [4] 🪁 Fly.io       - Edge deployment, generous free tier
echo   [5] 🐳 Docker       - Build Docker image locally
echo   [6] 📦 Build Only   - Create production build
echo.
set /p choice="  Enter choice [1-6]: "

if "%choice%"=="1" goto railway
if "%choice%"=="2" goto vercel
if "%choice%"=="3" goto render
if "%choice%"=="4" goto flyio
if "%choice%"=="5" goto docker
if "%choice%"=="6" goto build
goto invalid

:railway
echo.
echo 🚀 Deploying to Railway...
where railway >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Railway CLI...
    call npm install -g @railway/cli
)
echo.
echo 📝 Make sure you have:
echo    1. A Railway account ^(https://railway.app^)
echo    2. Set environment variables in Railway dashboard
echo.
pause
call railway login
call railway init
call railway up
echo.
echo ✅ Deployed to Railway!
goto done

:vercel
echo.
echo 🔺 Deploying to Vercel...
where vercel >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Vercel CLI...
    call npm install -g vercel
)
echo.
echo 📝 Note: Vercel works best for the frontend.
pause
call vercel
echo.
echo ✅ Deployed to Vercel!
goto done

:render
echo.
echo 🟣 Deploying to Render...
echo.
echo 📝 To deploy to Render:
echo    1. Push your code to GitHub
echo    2. Go to https://render.com
echo    3. Create a new Web Service
echo    4. Connect your repository
echo    5. Use these settings:
echo       - Build Command: npm install ^&^& npm run build
echo       - Start Command: npm start
echo    6. Add your environment variables
echo.
echo render.yaml is already configured for you!
goto done

:flyio
echo.
echo 🪁 Deploying to Fly.io...
where fly >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Fly CLI...
    powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
)
pause
call fly auth login
call fly launch --copy-config --yes
echo.
echo Setting secrets...
echo Run: fly secrets set JWT_SECRET=^<your-secret^> SUPABASE_URL=^<url^> ...
goto done

:docker
echo.
echo 🐳 Building Docker image...
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker not found! Install from: https://docker.com
    pause
    exit /b 1
)
docker build -t try-it-ai:latest .
echo.
echo ✅ Docker image built!
echo.
echo   Run locally:
echo   docker run -p 3001:3001 --env-file .env try-it-ai:latest
goto done

:build
echo.
echo 📦 Building for production...
call npm run build
echo.
echo ✅ Production build complete!
echo.
echo   Files are in the dist/ folder
echo   To run: npm start
goto done

:invalid
echo ❌ Invalid choice
pause
exit /b 1

:done
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Done! 🎉
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pause
