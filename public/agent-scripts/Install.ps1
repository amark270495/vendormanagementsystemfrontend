# =========================================================
# ENTERPRISE VMS AGENT INSTALLER
# VERSION 5.1.3 (FULLY PATCHED)
# =========================================================

# 1. Require Administrator Privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: You must right-click and 'Run as Administrator'!" -ForegroundColor Red
    Pause
    exit
}

$sourceDir = $PSScriptRoot
$baseDir = "C:\Tracking"

# 2. Create the Required Directories
$folders = @(
    "$baseDir",
    "$baseDir\Cache",
    "$baseDir\Logs",
    "$baseDir\State",
    "$baseDir\Temp"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
}
Write-Host "Directories initialized at C:\Tracking" -ForegroundColor Green

# 3. Copy all files from the Downloaded ZIP to C:\Tracking
Copy-Item -Path "$sourceDir\*.ps1" -Destination $baseDir -Force
Copy-Item -Path "$sourceDir\*.psm1" -Destination $baseDir -Force
Copy-Item -Path "$sourceDir\.env" -Destination $baseDir -Force
Copy-Item -Path "$sourceDir\*.xml" -Destination $baseDir -Force
Write-Host "Files successfully copied to C:\Tracking" -ForegroundColor Green

# 4. Import the Scheduled Tasks with current user context
$currentUser = "$env:USERDOMAIN\$env:USERNAME"
$xmlFiles = Get-ChildItem -Path $baseDir -Filter "*.xml"

foreach ($xml in $xmlFiles) {
    $taskName = $xml.BaseName
    Write-Host "Registering Scheduled Task: $taskName for user $currentUser..." -ForegroundColor Cyan
    
    # Register task running under the currently logged-in user context
    schtasks.exe /create /tn $taskName /xml $xml.FullName /ru $currentUser /f | Out-Null
}

Write-Host "All Scheduled Tasks registered successfully!" -ForegroundColor Green

# 5. Start the initial tracking process
Start-Process powershell.exe -ArgumentList @(
    '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden',
    '-File', "$baseDir\VMS_Tracker.ps1",
    '-ActionType', 'Login'
)

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Enterprise VMS Agent 5.1.3 Installed & Started Successfully" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Start-Sleep -Seconds 3