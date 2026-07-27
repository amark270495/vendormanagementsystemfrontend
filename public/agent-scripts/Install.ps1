# =========================================================
# ENTERPRISE VMS AGENT INSTALLER - V8.0.0
# (DIAGNOSTIC & SID BINDING EDITION)
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

# 3. Copy scripts from the Downloaded ZIP to C:\Tracking
Copy-Item -Path "$sourceDir\*.ps1" -Destination $baseDir -Force
Copy-Item -Path "$sourceDir\*.psm1" -Destination $baseDir -Force
Copy-Item -Path "$sourceDir\.env" -Destination $baseDir -Force
Write-Host "Scripts successfully copied to C:\Tracking" -ForegroundColor Green
Write-Host "-------------------------------------------------------"

# 4. FLAWLESS NATIVE XML GENERATION WITH SID BINDING

# Get the exact SID of the installing user (Bulletproof for Local, Domain, AzureAD, and MSA)
$currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value

# Dynamic StartBoundary to prevent Windows from rejecting old 2024 dates
$startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")

function Register-VMSTask {
    param($TaskName, $TriggersXml, $ScriptFile, $ArgsStr, $RunLevel = "LeastPrivilege")
    
    # Generate the XML blueprint. 
    $xmlString = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Author>Taproot Solutions</Author>
    <URI>\$TaskName</URI>
  </RegistrationInfo>
  <Triggers>
    $TriggersXml
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$currentSid</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>$RunLevel</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT72H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions>
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Tracking\$ScriptFile" $ArgsStr</Arguments>
    </Exec>
  </Actions>
</Task>
"@

    # Remove all dangerous whitespaces, newlines, and carriage returns that break schtasks
    $cleanXml = $xmlString.Trim() -replace "`r`n", "`n" -replace "`n", "`r`n"
    $tempPath = "$baseDir\Temp\$TaskName.xml"

    # Force .NET Framework to write pristine UTF-16LE with BOM
    [System.IO.File]::WriteAllText($tempPath, $cleanXml, [System.Text.Encoding]::Unicode)

    # 1st Defense: Verify XML Validity before attempting import
    try {
        [xml]$testXml = Get-Content $tempPath -ErrorAction Stop
    } catch {
        Write-Host " -> FAILED: $TaskName (XML INVALID)" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Yellow
        return
    }

    # Delete existing task if user is reinstalling
    schtasks.exe /delete /tn $TaskName /f 2>$null

    # 2nd Defense: Import the task and CAPTURE the exact error output
    $output = schtasks.exe /create /tn $TaskName /xml $tempPath /f 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Host " -> SUCCESS: $TaskName registered." -ForegroundColor Cyan
    } else {
        Write-Host " -> FAILED: $TaskName" -ForegroundColor Red
        Write-Host "    ERROR DETAIL: $output" -ForegroundColor Yellow
    }
}

# ---------------------------------------------------------
# Define Triggers and Register All 7 Tasks
# ---------------------------------------------------------

# Note: Using LeastPrivilege for user-space tracking to avoid Access Denied errors.
Register-VMSTask "VMS_Tracker_Login" "<LogonTrigger><Enabled>true</Enabled></LogonTrigger>" "VMS_Tracker.ps1" "-ActionType `"Login`""

Register-VMSTask "VMS_Tracker_Unlock" "<SessionStateChangeTrigger><Enabled>true</Enabled><StateChange>SessionUnlock</StateChange></SessionStateChangeTrigger>" "VMS_Tracker.ps1" "-ActionType `"Unlock`""

Register-VMSTask "VMS_Tracker_Lock" "<SessionStateChangeTrigger><Enabled>true</Enabled><StateChange>SessionLock</StateChange></SessionStateChangeTrigger>" "VMS_Tracker.ps1" "-ActionType `"Lock`""

# If RemoteDisconnect fails on some Windows editions, it will print the error safely and continue the installation
Register-VMSTask "VMS_Tracker_Logout" "<SessionStateChangeTrigger><Enabled>true</Enabled><StateChange>RemoteDisconnect</StateChange></SessionStateChangeTrigger>" "VMS_Tracker.ps1" "-ActionType `"Logout`""

Register-VMSTask "VMS_Recovery" "<BootTrigger><Enabled>true</Enabled></BootTrigger><LogonTrigger><Enabled>true</Enabled></LogonTrigger>" "VMS_Recovery.ps1" "" "HighestAvailable"

$intervalTrigger = @"
<CalendarTrigger>
  <Repetition><Interval>PT30M</Interval><Duration>P1D</Duration><StopAtDurationEnd>false</StopAtDurationEnd></Repetition>
  <StartBoundary>$startDate</StartBoundary>
  <Enabled>true</Enabled>
  <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
</CalendarTrigger>
"@
Register-VMSTask "VMS_Telemetry" $intervalTrigger "VMS_Telemetry.ps1" "" "HighestAvailable"

$watchdogTrigger = $intervalTrigger -replace "PT30M", "PT5M"
Register-VMSTask "VMS_Watchdog" $watchdogTrigger "VMS_Watchdog.ps1" "" "HighestAvailable"

# Clean up temporary XML files
Remove-Item -Path "$baseDir\Temp\*.xml" -Force -ErrorAction SilentlyContinue

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
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')