@echo off
echo.
echo ========================================
echo    Try-It! - Installation
echo ========================================
echo.
echo Installing dependencies...
echo (This may take a few minutes)
echo.
call npm install
echo.
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo To start the app, run:
echo    npm run dev:server   (Terminal 1)
echo    npm run dev:client   (Terminal 2)
echo.
echo Or open two terminals and run:
echo    Terminal 1: npm run dev:server
echo    Terminal 2: npm run dev:client
echo.
pause
