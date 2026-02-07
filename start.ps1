# ============================================
# TRY-IT! ONE-CLICK STARTER (PowerShell)
# ============================================
# Right-click > Run with PowerShell
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TRY-IT! AI ASSISTANT - STARTING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not installed!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "[1/2] Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Dependencies installed!" -ForegroundColor Green

# Start the app
Write-Host ""
Write-Host "[2/2] Starting Try-It!..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   APP STARTING!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Open browser after delay
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:5173"
} | Out-Null

# Run the dev server
npm run dev
