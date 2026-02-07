@echo off
echo ========================================
echo    Try-It! - Installation Script
echo ========================================
echo.

echo [1/3] Deleting old node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo [2/3] Installing dependencies...
call npm install --legacy-peer-deps

echo [3/3] Starting app...
call npx vite

pause
