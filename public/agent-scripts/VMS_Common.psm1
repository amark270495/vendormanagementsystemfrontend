# =========================================================
# ENTERPRISE VMS AGENT - COMMON MODULE
# VERSION: 5.1.3 (STABLE - FULLY PATCHED)
# =========================================================

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# =========================================================
# GLOBAL PATHS
# =========================================================

$Global:VMSBaseDir = "C:\Tracking"

$Global:CacheDir = Join-Path $Global:VMSBaseDir "Cache"
$Global:LogsDir  = Join-Path $Global:VMSBaseDir "Logs"
$Global:StateDir = Join-Path $Global:VMSBaseDir "State"
$Global:TempDir  = Join-Path $Global:VMSBaseDir "Temp"

$directories = @(
    $Global:VMSBaseDir,
    $Global:CacheDir,
    $Global:LogsDir,
    $Global:StateDir,
    $Global:TempDir
)

foreach ($dir in $directories) {
    try {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    catch {}
}

# =========================================================
# LOGGING ENGINE (CONCURRENCY SAFE)
# =========================================================

function Write-VMSLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $logFile = Join-Path $Global:LogsDir "agent.log"
    # Note the explicit `r`n for a proper Windows line break when using .NET classes
    $entry = "[{0}] [{1}] {2}`r`n" -f (Get-Date).ToString("s"), $Level, $Message

    $maxRetries = 5
    $retryCount = 0
    $success = $false

    while (-not $success -and $retryCount -lt $maxRetries) {
        try {
            # Rotate logs above 10MB
            if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 10MB)) {
                $archive = Join-Path $Global:LogsDir ("agent_" + (Get-Date -Format "yyyyMMddHHmmss") + ".log")
                Move-Item -Path $logFile -Destination $archive -Force
            }

            # Use native .NET for atomic writes; handles file locks securely
            [System.IO.File]::AppendAllText($logFile, $entry, [System.Text.Encoding]::UTF8)
            $success = $true
        }
        catch {
            $retryCount++
            # Randomized backoff: If two scripts collide, wait 50-200ms before retrying
            Start-Sleep -Milliseconds (Get-Random -Minimum 50 -Maximum 200)
        }
    }
}

# =========================================================
# ENVIRONMENT VARIABLE LOADER
# =========================================================

function Import-VMSEnvironment {
    param(
        [string]$EnvFile = "C:\Tracking\.env"
    )

    try {
        if (-not (Test-Path $EnvFile)) {
            throw ".env file missing at $EnvFile"
        }

        Get-Content $EnvFile | ForEach-Object {
            $line = $_.Trim()

            if (-not [string]::IsNullOrWhiteSpace($line) -and -not $line.StartsWith('#') -and $line.Contains('=')) {
                
                # BULLETPROOF PARSING: Bypass PS5 Regex/Split arrays entirely
                $splitIndex = $line.IndexOf('=')
                
                if ($splitIndex -gt 0) {
                    $name  = $line.Substring(0, $splitIndex).Trim()
                    $value = $line.Substring($splitIndex + 1).Trim()

                    [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
                }
            }
        }

        Write-VMSLog ".env configuration loaded successfully"
    }
    catch {
        Write-VMSLog "Failed loading .env file: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# =========================================================
# API REACHABILITY TEST
# =========================================================

function Test-VMSApiReachable {
    param(
        [string]$ApiUrl
    )

    try {
        $response = Invoke-WebRequest `
            -Uri $ApiUrl `
            -Method GET `
            -UseBasicParsing `
            -TimeoutSec 10 `
            -ErrorAction Stop

        return $true
    }
    catch {
        # Azure Functions may reject GET/HEAD but still be reachable
        if ($_.Exception.Response -and ($_.Exception.Response.StatusCode.value__ -eq 401 -or $_.Exception.Response.StatusCode.value__ -eq 405)) {
            Write-VMSLog "API reachable (auth protected)"
            return $true
        }

        Write-VMSLog "API unreachable: $($_.Exception.Message)" "WARN"
        return $false
    }
}

# =========================================================
# ATOMIC JSON WRITER
# =========================================================

function Write-AtomicJson {
    param(
        [string]$Path,
        [object]$Data
    )

    try {
        $tempFile = "$Path.tmp"

        # FIX: Strict JSON object handling via -InputObject
        $json = ConvertTo-Json -InputObject $Data -Depth 20

        Set-Content -Path $tempFile -Value $json -Encoding UTF8

        # Validate JSON before replacing original
        $null = Get-Content $tempFile -Raw | ConvertFrom-Json

        Move-Item -Path $tempFile -Destination $Path -Force

        return $true
    }
    catch {
        Write-VMSLog "Atomic JSON write failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# =========================================================
# SAFE JSON READER
# =========================================================

function Read-SafeJson {
    param(
        [string]$Path
    )

    try {
        if (-not (Test-Path $Path)) {
            return @()
        }

        $raw = Get-Content -Path $Path -Raw

        if ([string]::IsNullOrWhiteSpace($raw)) {
            return @()
        }

        return $raw | ConvertFrom-Json
    }
    catch {
        Write-VMSLog "JSON corruption detected at $Path" "ERROR"

        try {
            $corruptFile = "$Path.corrupt_$(Get-Date -Format yyyyMMddHHmmss)"
            Move-Item -Path $Path -Destination $corruptFile -Force
        }
        catch {}

        return @()
    }
}

# =========================================================
# API UPLOAD ENGINE
# =========================================================

function Invoke-VMSApiUpload {
    param(
        [string]$ApiUrl,
        [string]$ApiKey,
        [array]$Payload
    )

    try {
        $headers = @{
            "x-functions-key" = $ApiKey
            "Content-Type"    = "application/json"
        }

        # FIX: Force array wrapping so single-items aren't converted to flat JSON objects
        $body = ConvertTo-Json -InputObject @($Payload) -Depth 20 -Compress

        Invoke-RestMethod `
            -Uri $ApiUrl `
            -Method POST `
            -Headers $headers `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
            -TimeoutSec 30 `
            -ErrorAction Stop | Out-Null

        Write-VMSLog "Uploaded $($Payload.Count) event(s)"
        return $true
    }
    catch {
        Write-VMSLog "API upload failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# =========================================================
# MEMORY CLEANUP
# =========================================================

function Invoke-VMSMemoryCleanup {
    try {
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        Write-VMSLog "Memory cleanup completed"
    }
    catch {}
}

# =========================================================
# HEALTH CHECK
# =========================================================

function Test-VMSHealth {
    try {
        $health = @{
            timestamp = (Get-Date).ToString("o")
            powershellVersion = $PSVersionTable.PSVersion.ToString()
            machine = $env:COMPUTERNAME
            user = $env:USERNAME
        }

        Write-VMSLog "Health check completed: $($health | ConvertTo-Json -Compress)"
        return $true
    }
    catch {
        Write-VMSLog "Health check failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# =========================================================
# EXPORT FUNCTIONS
# =========================================================

Export-ModuleMember -Function *