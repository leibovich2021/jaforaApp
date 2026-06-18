# Jafora APK Builder
# Run: .\build-apk.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Jafora - Build APK for Samsung" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

Write-Host "[1/3] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "[2/3] Login to Expo (free account)" -ForegroundColor Yellow
Write-Host "      A browser will open - login once" -ForegroundColor Gray
npx eas login
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "      Configuring project..." -ForegroundColor Gray
npx eas build:configure --platform android
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "[3/3] Building APK in cloud (~15 min)..." -ForegroundColor Yellow
npx eas build --platform android --profile preview
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Done! Download APK from the link above." -ForegroundColor Green
Write-Host "See BUILD.md for Samsung install instructions." -ForegroundColor Green
Write-Host ""
