# =========================================================
# ENTERPRISE VMS AGENT INSTALLER
# VERSION 6.0.0 (NATIVE TASK GENERATION)
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

# 4. NATIVE XML GENERATION (Bypasses all encoding bugs)
$currentUser = "$env:USERDOMAIN\$env:USERNAME"

function Register-VMSTask {
    param($TaskName, $TriggersXml, $ScriptFile, $ArgsStr)
    
    $xml = @"
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
      <UserId>$currentUser</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
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

    # Save exactly as Windows Native Unicode (UTF-16LE with CRLF)
    $tempPath = "$baseDir\Temp\$TaskName.xml"
    $xml -replace "`n", "`r`n" -replace "`r`r", "`r" | Out-File -FilePath $tempPath -Encoding Unicode -Force

    schtasks.exe /create /tn $TaskName /xml $tempPath /f | Out-Null
    
    if ($?) {
        Write-Host " -> $TaskName registered successfully." -ForegroundColor Cyan
    } else {
        Write-Host " -> FAILED to register $TaskName." -ForegroundColor Red
    }
}

# Generate and Register All 7 Tasks
Register-VMSTask "VMS_Tracker_Login" "<LogonTrigger><Enabled>true</Enabled></LogonTrigger>" "VMS_Tracker.ps1" "-ActionType `"Login`""
Register-VMSTask "VMS_Tracker_Unlock" "<SessionStateChangeTrigger><Enabled>true</Enabled><StateChange>SessionUnlock</StateChange></SessionStateChangeTrigger>" "VMS_Tracker.ps1" "-ActionType `"Unlock`""
Register-VMSTask "VMS_Tracker_Lock" "<SessionStateChangeTrigger><Enabled>true</Enabled><StateChange>SessionLock</StateChange></SessionStateChangeTrigger>" "VMS_Tracker.ps1" "-ActionType `"Lock`""
Register-VMSTask "VMS_Tracker_Logout" "<SessionStateChangeTrigger><Enabled>true</Enabled><StateChange>RemoteDisconnect</StateChange></SessionStateChangeTrigger>" "VMS_Tracker.ps1" "-ActionType `"Logout`""
Register-VMSTask "VMS_Recovery" "<BootTrigger><Enabled>true</Enabled></BootTrigger><LogonTrigger><Enabled>true</Enabled></LogonTrigger>" "VMS_Recovery.ps1" ""

$intervalTrigger = @"
<CalendarTrigger>
  <Repetition><Interval>PT30M</Interval><Duration>P1D</Duration><StopAtDurationEnd>false</StopAtDurationEnd></Repetition>
  <StartBoundary>2024-01-01T00:00:00</StartBoundary>
  <Enabled>true</Enabled>
  <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
</CalendarTrigger>
"@
Register-VMSTask "VMS_Telemetry" $intervalTrigger "VMS_Telemetry.ps1" ""

$watchdogTrigger = $intervalTrigger -replace "PT30M", "PT5M"
Register-VMSTask "VMS_Watchdog" $watchdogTrigger "VMS_Watchdog.ps1" ""

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
Start-Sleep -Seconds 15