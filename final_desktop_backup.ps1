
$sourceDir = "C:\Users\basel\Downloads\TryIt-ULTIMATE-FINAL"
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$date = Get-Date -Format "yyyy-MM-dd"
$zipName = "TryIt-ULTIMATE-FINAL-Backup-$date.zip"
$zipPath = Join-Path -Path $desktopPath -ChildPath $zipName
$tempDir = Join-Path -Path $desktopPath -ChildPath "TryIt_Temp_Staging"

# Clean up previous attempts
if (Test-Path $tempDir) { Remove-Item -Path $tempDir -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item -Path $zipPath -Force }

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Creating backup of $sourceDir to $zipPath"

# Exclusions
$exclude = @("node_modules", ".git", "dist", "build", ".vscode", "temp_backup_*", "*.zip", ".DS_Store")

# Get all items in source directory
$items = Get-ChildItem -Path $sourceDir

foreach ($item in $items) {
    if ($exclude -notcontains $item.Name) {
        Write-Host "  Copying $($item.Name)..."
        Copy-Item -Path $item.FullName -Destination $tempDir -Recurse -Force
    } else {
        Write-Host "  Skipping $($item.Name)"
    }
}

Write-Host "Compressing..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

Write-Host "Cleaning up..."
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "✅ DONE! Backup saved to: $zipPath"
