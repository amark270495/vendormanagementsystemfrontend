# =========================================================
# ENTERPRISE VMS AGENT INSTALLER
# VERSION 5.1.3
# =========================================================

$baseDir = "C:\Tracking"

$folders = @(
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

Write-Host "Enterprise VMS Agent 5.1.3 folders initialized"

$envFile = "$baseDir\.env"

if (-not (Test-Path $envFile)) {
    Write-Host ".env file missing at $envFile" -ForegroundColor Red
    exit
}

Write-Host ".env file validated"

Start-Process powershell.exe -ArgumentList @(
    '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden',
    '-File', "$baseDir\VMS_Tracker.ps1",
    '-ActionType', 'Login'
)

Write-Host "Enterprise VMS Agent 5.1.3 started successfully"
