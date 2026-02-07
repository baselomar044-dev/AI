@echo off
REM ============================================
REM 🚀 TRY-IT! ONE-CLICK LOCAL DEPLOYMENT (Windows)
REM ============================================
REM Usage: double-click deploy-local.bat
REM ============================================

title Try-It! AI Assistant - Deployment

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║     🚀 TRY-IT! AI ASSISTANT - LOCAL DEPLOYMENT 🚀        ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check if node is installed
echo [1/6] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

REM Check if npm is installed
echo [2/6] Checking npm...
npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% found

REM Install dependencies
echo [3/6] Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Check .env file
echo [4/6] Checking environment variables...
if not exist .env (
    echo ⚠️  .env file not found, copying from .env.example...
    copy .env.example .env
)
echo ✅ Environment configured

REM Build the frontend
echo [5/6] Building frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build frontend!
    pause
    exit /b 1
)
echo ✅ Frontend built

REM Start the application
echo [6/6] Starting Try-It!...
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   🎉 TRY-IT! IS NOW RUNNING!                             ║
echo ║                                                           ║
echo ║   🌐 Frontend: http://localhost:5173                     ║
echo ║   🔧 Backend:  http://localhost:3001                     ║
echo ║                                                           ║
echo ║   Press Ctrl+C to stop                                   ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Run both frontend and backend
call npm run dev

pause
