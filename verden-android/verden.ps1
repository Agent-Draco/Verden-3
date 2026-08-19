# ==============================================================================
# Verden Maps - Android Auto Local Deployment & DHU Launcher
# ==============================================================================

# Configurable Paths
$ApkPath = "M:\DevProjects-B1\Verden Maps\verden-android\app\build\outputs\apk\debug\app-debug.apk"
$DhuDir  = "$env:LOCALAPPDATA\Android\Sdk\extras\google\auto"

Write-Host "`n[1/4] Checking ADB Device Connection..." -ForegroundColor Cyan
$devices = adb devices | Select-String -Pattern "\tdevice$"
if (-not $devices) {
    Write-Host "X Error: No connected ADB devices found! Ensure your phone is connected via USB with USB Debugging enabled." -ForegroundColor Red
    Exit
}
Write-Host "-> Phone detected successfully!" -ForegroundColor Green

Write-Host "`n[2/4] Installing / Updating APK on Phone..." -ForegroundColor Cyan
if (Test-Path $ApkPath) {
    adb install -r -g $ApkPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "-> APK installed and permissions granted!" -ForegroundColor Green
    } else {
        Write-Host "X Warning: APK installation failed. Proceeding with existing installed app..." -ForegroundColor Yellow
    }
} else {
    Write-Host "X Warning: APK file not found at: $ApkPath. Skipping installation." -ForegroundColor Yellow
}

Write-Host "`n[3/4] Forwarding ADB Port 5277..." -ForegroundColor Cyan
adb forward tcp:5277 tcp:5277
Write-Host "-> Port 5277 forwarded successfully!" -ForegroundColor Green

Write-Host "`n[4/4] Launching Desktop Head Unit Simulator..." -ForegroundColor Cyan
if (Test-Path "$DhuDir\desktop-head-unit.exe") {
    Set-Location $DhuDir
    Write-Host "-> Launching DHU... Ensure 'Start head unit server' is active in Android Auto settings on your phone!" -ForegroundColor Yellow
    Start-Process -FilePath ".\desktop-head-unit.exe"
} else {
    Write-Host "X Error: desktop-head-unit.exe not found at $DhuDir" -ForegroundColor Red
    Write-Host "  Please install 'Android Auto Desktop Head Unit emulator' via Android Studio SDK Manager." -ForegroundColor Yellow
}