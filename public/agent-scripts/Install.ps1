# =========================================================
# ENTERPRISE VMS AGENT INSTALLER
# VERSION 5.1.4 (ENCODING & SID FIX)
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
Write-Host "-------------------------------------------------------"

# 4. Dynamically configure and import XML files (Fixes UTF-8/UTF-16 errors)
$xmlFiles = Get-ChildItem -Path $baseDir -Filter "*.xml"
$currentUser = "$env:USERDOMAIN\$env:USERNAME"

foreach ($xml in $xmlFiles) {
    $taskName = $xml.BaseName
    Write-Host "Configuring Task: $taskName..." -ForegroundColor Cyan
    
    # Read the raw UTF-8 text exported by the React JSZip generator
    $content = Get-Content $xml.FullName -Raw

    # Force the XML header to UTF-16
    $content = $content -replace '<\?xml.*?\?>', '<?xml version="1.0" encoding="UTF-16"?>'

    # Remove any existing, broken, or hardcoded Principals block
    $content = $content -replace '(?s)\s*<Principals>.*?</Principals>', ''

    # Determine required privileges
    $runLevel = if ($taskName -match "Tracker") { "HighestAvailable" } else { "LeastPrivilege" }
    
    # Inject the flawless Principals block using the employee's exact Windows Username
    $principalsBlock = @"
  <Principals>
    <Principal id="Author">
      <UserId>$currentUser</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>$runLevel</RunLevel>
    </Principal>
  </Principals>
  <Settings>
"@
    
    # Insert it perfectly before Settings
    $content = $content -replace '<Settings>', $principalsBlock

    # CRITICAL: Save explicitly as Unicode (UTF-16LE) which Windows natively requires
    Set-Content -Path $xml.FullName -Value $content -Encoding Unicode

    # Import the task (No /ru flag required, preventing password hangs)
    schtasks.exe /create /tn $taskName /xml $xml.FullName /f | Out-Null
    
    if ($?) {
        Write-Host " -> $taskName registered successfully." -ForegroundColor Green
    } else {
        Write-Host " -> FAILED to register $taskName." -ForegroundColor Red
    }
}

Write-Host "-------------------------------------------------------"
Write-Host "All Scheduled Tasks processed!" -ForegroundColor Green

# 5. Start the initial tracking process
Start-Process powershell.exe -ArgumentList @(
    '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden',
    '-File', "$baseDir\VMS_Tracker.ps1",
    '-ActionType', 'Login'
)

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Enterprise VMS Agent Installed & Started Successfully" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Start-Sleep -Seconds 15