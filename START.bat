@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           🚀 TRY-IT! AI - Starting Application               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Please install from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('node -v') do set NODE_VER=%%v
echo ✅ Node.js %NODE_VER% detected

:: Check for .env
if not exist ".env" (
    echo.
    echo ⚠️  No .env file found! Creating from example...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo ✅ Created .env from .env.example
        echo.
        echo 📝 IMPORTANT: Edit .env and add your API keys!
        echo.
    ) else (
        echo # TRY-IT! Configuration > .env
        echo JWT_SECRET=dev-secret-change-in-production >> .env
        echo PORT=3001 >> .env
        echo ✅ Created basic .env file
    )
)

:: Install dependencies
if not exist "node_modules" (
    echo.
    echo 📦 Installing dependencies... (this may take a minute)
    echo.
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ⚠️  First install attempt failed, retrying...
        call npm cache clean --force
        call npm install --legacy-peer-deps
    )
)

echo.
echo 🚀 Starting development server...
echo.
echo    📱 Local:   http://localhost:5173
echo    🌐 Network: Check console for external URL
echo.
echo    Press Ctrl+C to stop
echo.

call npm run dev

pause
