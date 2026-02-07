
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipName = "TryIt-ULTIMATE-FINAL-Backup-$timestamp.zip"
$destination = Join-Path -Path $PWD -ChildPath $zipName

# Explicitly list folders and files to include to avoid node_modules and locks
$folders = @("src", "server", "public", "database", "api", "data", "scripts", "tests")
$files = @("package.json", "tsconfig.json", "vite.config.ts", "index.html", ".env", "tailwind.config.js", "postcss.config.js", "audit-system.ts")

# Create a temporary directory for staging
$tempDir = Join-Path -Path $PWD -ChildPath "temp_backup_$timestamp"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Staging files for backup..."

# Copy Folders
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "  + $folder"
        Copy-Item -Path $folder -Destination $tempDir -Recurse -Force
    }
}

# Copy Files
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  + $file"
        Copy-Item -Path $file -Destination $tempDir -Force
    }
}

Write-Host "Compressing archive (this may take a moment)..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $destination -Force

Write-Host "Cleaning up temporary files..."
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "✅ Backup created successfully: $destination"
