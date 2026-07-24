# =========================================================
# ENTERPRISE WATCHDOG ENGINE
# VERSION 5.1.3
# =========================================================

Import-Module "C:\Tracking\VMS_Common.psm1" -Force

$trackerProcess = Get-Process powershell -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*VMS_Tracker.ps1*"
}

$stateFile = "C:\Tracking\State\tracker_state.json"

$restartNeeded = $false

if (-not $trackerProcess) {
    $restartNeeded = $true
}

if (Test-Path $stateFile) {
    try {
        # FIX: Safe JSON Reading
        $state = Read-SafeJson -Path $stateFile
        
        if ($state -and $state.lastLoop) {
            $lastLoop = [DateTime]::Parse($state.lastLoop)

            if (((Get-Date) - $lastLoop).TotalMinutes -gt 5) {
                $restartNeeded = $true
            }
        }
        else {
            $restartNeeded = $true
        }
    }
    catch {
        $restartNeeded = $true
    }
}
else {
    $restartNeeded = $true
}

if ($restartNeeded) {
    Write-VMSLog "Watchdog triggered: Restarting Tracker..." "WARN"

    # FIX: Corrected path from \Scripts\ to \
    Start-Process powershell.exe -ArgumentList @(
        '-ExecutionPolicy', 'Bypass',
        '-WindowStyle', 'Hidden',
        '-File', 'C:\Tracking\VMS_Tracker.ps1',
        '-ActionType', 'RecoveryRestart'
    )
}