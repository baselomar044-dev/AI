@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   🚀 DEPLOYING TRY-IT! ULTIMATE TO VERCEL
echo ===================================================
echo.

:: 1. Add Node.js to PATH explicitly
echo 🔧 Configuring Environment...
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

:: 2. Check if npm is accessible
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  npm not found in PATH. Trying fallback...
    if exist "%NODE_PATH%\npm.cmd" (
        echo ✅ Found npm at %NODE_PATH%\npm.cmd
    ) else (
        echo ❌ CRITICAL: npm.cmd not found in %NODE_PATH%
        echo    Please install Node.js or check your installation.
        exit /b 1
    )
) else (
    echo ✅ npm is accessible.
)

:: 3. Run Deployment
echo.
echo 📤 Starting Vercel Deployment...
echo    - Project: try-it-ai-ultimate
echo.

:: Run Vercel and capture output to log file AND stdout
call npx vercel --prod --yes --force --token cAMMgI1hD9o1H23PDkpqFpOU --name try-it-ai-ultimate > deploy_output.txt 2>&1

if %errorlevel% neq 0 (
  echo.
  echo ❌ Deployment failed. Output:
  type deploy_output.txt
  exit /b %errorlevel%
) else (
  echo.
  echo ✅ DEPLOYMENT SUCCESSFUL!
  echo 🔍 Scanning for URL...
  type deploy_output.txt
)
