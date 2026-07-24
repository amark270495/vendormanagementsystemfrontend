# =========================================================
# ENTERPRISE TELEMETRY WORKER
# FULLY FIXED VERSION
# =========================================================

$ErrorActionPreference = "Stop"

Import-Module "C:\Tracking\VMS_Common.psm1" -Force
Import-VMSEnvironment

# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================
$agentVersion = $env:VMS_AGENT_VERSION
$assetId      = $env:VMS_ASSET_ID
$userEmail    = $env:VMS_USER_EMAIL
$apiUrl       = $env:VMS_API_URL
$apiKey       = $env:VMS_API_KEY

$events = @()
$timestamp = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")

# =========================================================
# SAFE EXECUTION WRAPPER
# =========================================================
function Invoke-Safely {
    param(
        [string]$Operation,
        [scriptblock]$ScriptBlock
    )

    try {
        & $ScriptBlock
    }
    catch {
        Write-VMSLog ($Operation + " failed: " + $_.Exception.ToString()) "ERROR"
    }
}

# =========================================================
# SYSTEM HEALTH
# =========================================================
Invoke-Safely -Operation "System Health Collection" -ScriptBlock {

    $os = Get-CimInstance Win32_OperatingSystem
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"

    # -----------------------------------------------------
    # STABLE CPU COLLECTION
    # -----------------------------------------------------
    $cpuCounter = Get-Counter '\Processor(_Total)\% Processor Time'
    $cpu = [math]::Round($cpuCounter.CounterSamples.CookedValue, 2)

    if ($cpu -lt 0) {
        $cpu = 0
    }

    # -----------------------------------------------------
    # MEMORY
    # -----------------------------------------------------
    $memoryUsage = [math]::Round(
        (
            (
                ($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) /
                $os.TotalVisibleMemorySize
            ) * 100
        ),
        2
    )

    # -----------------------------------------------------
    # UPTIME
    # -----------------------------------------------------
    $uptimeHours = [math]::Round(
        ((Get-Date) - $os.LastBootUpTime).TotalHours,
        2
    )

    # -----------------------------------------------------
    # DISK
    # -----------------------------------------------------
    $diskFreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
    $diskTotalGB = [math]::Round($disk.Size / 1GB, 2)

    # FIX: Explicitly target the script-scoped variable
    $script:events += @{
        agentVersion = $agentVersion
        assetId      = $assetId
        userEmail    = $userEmail

        actionType   = "SystemHealth"
        eventCategory = "System"

        metadata = @{
            cpuUsagePercent    = $cpu
            memoryUsagePercent = $memoryUsage
            diskFreeGB         = $diskFreeGB
            diskTotalGB        = $diskTotalGB
            uptimeHours        = $uptimeHours
            windowsVersion     = $os.Caption
            osBuild            = $os.BuildNumber
            computerName       = $env:COMPUTERNAME
        }

        timestamp = $timestamp
    }

    Write-VMSLog "System Health collected successfully."
}

# =========================================================
# WINDOWS DEFENDER STATUS
# =========================================================
Invoke-Safely -Operation "Windows Defender Collection" -ScriptBlock {

    $defenderCommand = Get-Command Get-MpComputerStatus -ErrorAction SilentlyContinue

    if (-not $defenderCommand) {
        Write-VMSLog "Windows Defender cmdlets unavailable." "WARN"
        return
    }

    $defender = Get-MpComputerStatus

    if (-not $defender) {
        Write-VMSLog "Windows Defender returned no data." "WARN"
        return
    }

    $signatureAge = $null

    if ($defender.AntivirusSignatureLastUpdated) {

        $signatureAge = [math]::Round(
            (
                (Get-Date) - $defender.AntivirusSignatureLastUpdated
            ).TotalDays,
            2
        )
    }

    # FIX: Explicitly target the script-scoped variable
    $script:events += @{
        agentVersion = $agentVersion
        assetId      = $assetId
        userEmail    = $userEmail

        actionType   = "DefenderStatus"
        eventCategory = "Security"

        metadata = @{
            antivirusEnabled    = [bool]$defender.AMServiceEnabled
            realtimeProtection  = [bool]$defender.RealTimeProtectionEnabled
            engineVersion       = $defender.AMEngineVersion
            antivirusVersion    = $defender.AntivirusSignatureVersion
            signatureAgeDays    = $signatureAge
            defenderRunningMode = $defender.AMRunningMode
        }

        timestamp = $timestamp
    }

    Write-VMSLog "Windows Defender status collected successfully."
}

# =========================================================
# WINDOWS UPDATE SCAN
# =========================================================
Invoke-Safely -Operation "Windows Update Scan" -ScriptBlock {

    $wuaService = Get-Service wuauserv -ErrorAction SilentlyContinue

    if (-not $wuaService) {
        throw "Windows Update service not found."
    }

    # -----------------------------------------------------
    # START SERVICE IF STOPPED
    # -----------------------------------------------------
    if ($wuaService.Status -ne 'Running') {

        Write-VMSLog "Starting Windows Update service..." "WARN"

        Start-Service wuauserv -ErrorAction Stop
        Start-Sleep -Seconds 3

        $wuaService.Refresh()
    }

    if ($wuaService.Status -ne 'Running') {
        throw "Windows Update service failed to start."
    }

    # -----------------------------------------------------
    # COM OBJECT
    # -----------------------------------------------------
    $updateSession = New-Object -ComObject Microsoft.Update.Session

    if (-not $updateSession) {
        throw "Unable to create Microsoft.Update.Session COM object."
    }

    $updateSearcher = $updateSession.CreateUpdateSearcher()

    $searchResult = $updateSearcher.Search(
        "IsInstalled=0 and Type='Software'"
    )

    $criticalCount = 0
    $securityCount = 0

    $updatesList = @()

    foreach ($update in $searchResult.Updates) {

        if ($update.MsrcSeverity -eq 'Critical') {
            $criticalCount++
        }

        if ($update.MsrcSeverity -eq 'Important') {
            $securityCount++
        }

        $updatesList += $update.Title
    }

    # FIX: Explicitly target the script-scoped variable
    $script:events += @{
        agentVersion = $agentVersion
        assetId      = $assetId
        userEmail    = $userEmail

        actionType   = "WindowsUpdateScan"
        eventCategory = "WindowsUpdate"

        metadata = @{
            pendingCount = $searchResult.Updates.Count
            criticalCount = $criticalCount
            securityCount = $securityCount
            serviceStatus = $wuaService.Status.ToString()
            updates       = $updatesList
        }

        timestamp = $timestamp
    }

    Write-VMSLog "Windows Update scan completed successfully."
}

# =========================================================
# NETWORK CONNECTIVITY CHECK
# =========================================================
Invoke-Safely -Operation "Network Connectivity Check" -ScriptBlock {

    $internetAvailable = $false

    try {
        $internetAvailable = Test-Connection `
            -ComputerName 8.8.8.8 `
            -Count 1 `
            -Quiet
    }
    catch {
        $internetAvailable = $false
    }

    # FIX: Explicitly target the script-scoped variable
    $script:events += @{
        agentVersion = $agentVersion
        assetId      = $assetId
        userEmail    = $userEmail

        actionType   = "NetworkStatus"
        eventCategory = "Connectivity"

        metadata = @{
            internetAvailable = $internetAvailable
            machineName       = $env:COMPUTERNAME
        }

        timestamp = $timestamp
    }

    Write-VMSLog "Network connectivity check completed successfully."
}

# =========================================================
# FINAL PAYLOAD UPLOAD
# =========================================================
if ($events.Count -gt 0) {

    Write-VMSLog "Uploading $($events.Count) telemetry events..."

    try {

        Invoke-VMSApiUpload `
            -ApiUrl $apiUrl `
            -ApiKey $apiKey `
            -Payload $events | Out-Null

        Write-VMSLog "Telemetry upload completed successfully."
    }
    catch {

        Write-VMSLog (
            "Telemetry upload failed: " +
            $_.Exception.ToString()
        ) "ERROR"
    }
}
else {

    Write-VMSLog "No telemetry data collected." "WARN"
}

Write-VMSLog "Telemetry worker completed."