# =========================================================
# ENTERPRISE VMS RECOVERY ENGINE
# VERSION 5.1.3
# =========================================================

Import-Module "C:\Tracking\VMS_Common.psm1" -Force
Import-VMSEnvironment

$agentVersion = $env:VMS_AGENT_VERSION
$assetId = $env:VMS_ASSET_ID
$userEmail = $env:VMS_USER_EMAIL
$apiUrl = $env:VMS_API_URL
$apiKey = $env:VMS_API_KEY

$stateFile = "C:\Tracking\State\tracker_state.json"

Write-VMSLog "Recovery engine started"

function Send-RecoveryEvent {
    param(
        [string]$Action,
        [string]$Category,
        [string]$Notes = "",
        [object]$Metadata = $null
    )

    $payload = @(
        @{
            agentVersion = $agentVersion
            assetId = $assetId
            userEmail = $userEmail
            actionType = $Action
            eventCategory = $Category
            workDoneNotes = $Notes
            metadata = $Metadata
            timestamp = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    )

    Invoke-VMSApiUpload -ApiUrl $apiUrl -ApiKey $apiKey -Payload $payload | Out-Null
}

try {
    if (-not (Test-Path $stateFile)) {
        Send-RecoveryEvent -Action "FreshStart" -Category "Recovery" -Notes "No previous tracker state found"
        Write-VMSLog "Fresh start detected"
        exit
    }

    # FIX: Use SafeJson to prevent crash on corrupted shutdown state
    $state = Read-SafeJson -Path $stateFile
    
    if (-not $state -or -not $state.lastLoop) {
        exit
    }

    $lastLoop = [DateTime]::Parse($state.lastLoop)
    $minutesSinceLastLoop = ((Get-Date) - $lastLoop).TotalMinutes

    if ($minutesSinceLastLoop -gt 10) {
        Send-RecoveryEvent `
            -Action "OfflineShutdown" `
            -Category "Recovery" `
            -Notes "Unexpected tracker termination detected" `
            -Metadata @{
                staleMinutes = [math]::Round($minutesSinceLastLoop, 2)
                lastLoop = $lastLoop
            }

        Write-VMSLog "Unexpected shutdown detected"
    }
    else {
        Send-RecoveryEvent -Action "RecoveryHealthy" -Category "Recovery" -Notes "Tracker shutdown was clean"
        Write-VMSLog "Recovery check healthy"
    }
}
catch {
    Write-VMSLog "Recovery engine crash: $($_.Exception.Message)" "ERROR"

    try {
        Send-RecoveryEvent -Action "RecoveryEngineError" -Category "Recovery" -Notes $_.Exception.Message
    }
    catch {}
}