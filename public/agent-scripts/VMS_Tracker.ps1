# =========================================================
# ENTERPRISE VMS AGENT
# VERSION 5.1.3
# FINAL STABLE TRACKER ENGINE
# =========================================================

param(
    [string]$ActionType = "Login"
)

# =========================================================
# LOAD COMMON MODULE
# =========================================================

Import-Module "C:\Tracking\VMS_Common.psm1" -Force

Import-VMSEnvironment

# Allow desktop session to initialize
Start-Sleep -Seconds 30

# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

$agentVersion = $env:VMS_AGENT_VERSION
$assetId      = $env:VMS_ASSET_ID
$userEmail    = $env:VMS_USER_EMAIL
$apiUrl       = $env:VMS_API_URL
$apiKey       = $env:VMS_API_KEY

# =========================================================
# FILES
# =========================================================

$cacheFile = Join-Path $Global:CacheDir "offline_queue.json"
$stateFile = Join-Path $Global:StateDir "tracker_state.json"

# =========================================================
# SINGLE INSTANCE PROTECTION
# =========================================================

$mutexName = "Global\VMS_TRACKER_$assetId"

$mutex = New-Object System.Threading.Mutex($false, $mutexName)

if (-not $mutex.WaitOne(0, $false)) {
    Write-VMSLog "Tracker already running"
    exit
}

# =========================================================
# RUNTIME VARIABLES
# =========================================================

$script:queue = @()
$script:isIdle = $false
$script:lastUpload = Get-Date
$script:lastLoop = Get-Date
$lastHeartbeat = (Get-Date).AddMinutes(-2)
$lastApp = ""

# =========================================================
# WINDOWS API
# =========================================================

try {
    # FIX: Prevent "Type Already Exists" crash on script restart
    if (-not ("VMSKernel" -as [type])) {
        Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        using System.Text;

        public class VMSKernel {
            [DllImport("user32.dll")]
            public static extern IntPtr GetForegroundWindow();

            [DllImport("user32.dll")]
            public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

            [DllImport("user32.dll")]
            public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

            [DllImport("kernel32.dll")]
            public static extern ulong GetTickCount64();

            [StructLayout(LayoutKind.Sequential)]
            public struct LASTINPUTINFO {
                public uint cbSize;
                public uint dwTime;
            }

            public static long GetIdleTime() {
                LASTINPUTINFO info = new LASTINPUTINFO();
                info.cbSize = (uint)Marshal.SizeOf(info);

                if (GetLastInputInfo(ref info)) {
                    return (long)GetTickCount64() - (long)(uint)info.dwTime;
                }
                return 0;
            }
        }
"@
    }
}
catch {
    Write-VMSLog "Win32 API load failed: $($_.Exception.ToString())" "ERROR"
}

# =========================================================
# SAVE STATE
# =========================================================

function Save-State {
    try {
        $state = @{
            version = $agentVersion
            lastLoop = (Get-Date).ToString("o")
            lastUpload = $script:lastUpload.ToString("o")
            isIdle = $script:isIdle
            queueCount = $script:queue.Count
        }

        Write-AtomicJson -Path $stateFile -Data $state | Out-Null
    }
    catch {
        Write-VMSLog "Save-State failed: $($_.Exception.Message)" "ERROR"
    }
}

# =========================================================
# ADD EVENT
# =========================================================

function Add-VMSEvent {
    param(
        [string]$Action,
        [string]$Category,
        [string]$Notes = "",
        [object]$Metadata = $null
    )

    try {
        $event = @{
            agentVersion = $agentVersion
            assetId = $assetId
            userEmail = $userEmail
            actionType = $Action
            eventCategory = $Category
            workDoneNotes = $Notes
            metadata = $Metadata
            timestamp = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        }

        $script:queue += $event
    }
    catch {
        Write-VMSLog "Add-VMSEvent failed: $($_.Exception.Message)" "ERROR"
    }
}

# =========================================================
# QUEUE FLUSH ENGINE
# =========================================================

function Flush-Queue {
    try {
        # LOAD DISK QUEUE
        $diskQueue = @()

        if (Test-Path $cacheFile) {
            $diskQueue = Read-SafeJson -Path $cacheFile
        }

        # MEMORY QUEUE
        $memoryQueue = @($script:queue)

        # MERGE QUEUES
        $combinedQueue = @($diskQueue + $memoryQueue)

        # NOTHING TO UPLOAD
        if ($combinedQueue.Count -eq 0) {
            return
        }

        Write-VMSLog "Uploading $($combinedQueue.Count) event(s)"

        # DIRECT UPLOAD
        $success = Invoke-VMSApiUpload -ApiUrl $apiUrl -ApiKey $apiKey -Payload $combinedQueue

        # SUCCESS
        if ($success) {
            Remove-Item -Path $cacheFile -Force -ErrorAction SilentlyContinue
            $script:queue = @()
            $script:lastUpload = Get-Date
            Write-VMSLog "Queue uploaded successfully"
        }
        # FAILURE
        else {
            Write-AtomicJson -Path $cacheFile -Data $combinedQueue | Out-Null
            $script:queue = @()
            Write-VMSLog "Upload failed. Queue saved locally." "WARN"
        }
    }
    catch {
        Write-VMSLog "Flush-Queue crash: $($_.Exception.ToString())" "ERROR"
    }
}

# =========================================================
# STARTUP EVENTS
# =========================================================

Write-VMSLog "VMS Tracker 5.1.3 Started"

Add-VMSEvent -Action $ActionType -Category "Session"
Add-VMSEvent -Action "Heartbeat" -Category "Session" -Notes "Tracker Startup"

Flush-Queue

# =========================================================
# MAIN ENTERPRISE LOOP
# =========================================================

try {
    while ($true) {
        try {
            $script:lastLoop = Get-Date

            # IDLE DETECTION
            try {
                $idleMs = [VMSKernel]::GetIdleTime()

                if ($idleMs -ge 300000 -and -not $script:isIdle) {
                    $script:isIdle = $true
                    Add-VMSEvent -Action "Idle" -Category "Idle"
                }
                elseif ($idleMs -lt 60000 -and $script:isIdle) {
                    $script:isIdle = $false
                    Add-VMSEvent -Action "Active" -Category "Session"
                }
            }
            catch {
                Write-VMSLog "Idle detection failed: $($_.Exception.Message)" "WARN"
            }

            # ACTIVE APPLICATION TRACKING
            try {
                $hwnd = [VMSKernel]::GetForegroundWindow()

                if ($hwnd -ne [IntPtr]::Zero) {
                    $sb = New-Object System.Text.StringBuilder 1024
                    $result = [VMSKernel]::GetWindowText($hwnd, $sb, $sb.Capacity)

                    if ($result -gt 0) {
                        $app = $sb.ToString().Trim()

                        if (-not [string]::IsNullOrWhiteSpace($app)) {
                            $secondsSinceHeartbeat = ((Get-Date) - $lastHeartbeat).TotalSeconds

                            if ($app -ne $lastApp -or $secondsSinceHeartbeat -ge 30) {
                                Add-VMSEvent -Action "ActiveApp" -Category "Usage" -Notes $app
                                $lastApp = $app
                            }
                        }
                    }
                }
            }
            catch {
                Write-VMSLog "App tracking failed: $($_.Exception.Message)" "WARN"
            }

            # HEARTBEAT
            try {
                $minutesSinceHeartbeat = ((Get-Date) - $lastHeartbeat).TotalMinutes

                if ($minutesSinceHeartbeat -ge 1) {
                    Add-VMSEvent -Action "Heartbeat" -Category "Session" -Notes "Agent Active"
                    $lastHeartbeat = Get-Date
                }
            }
            catch {
                Write-VMSLog "Heartbeat failed: $($_.Exception.Message)" "WARN"
            }

            # MEMORY CLEANUP
            try {
                if ((Get-Date).Minute % 30 -eq 0) {
                    Invoke-VMSMemoryCleanup
                }
            }
            catch {}

            # QUEUE FLUSH
            try {
                $secondsSinceUpload = ((Get-Date) - $script:lastUpload).TotalSeconds

                if ($secondsSinceUpload -ge 30) {
                    Flush-Queue
                }
            }
            catch {
                Write-VMSLog "Queue flush failed: $($_.Exception.Message)" "WARN"
            }

            # SAVE STATE
            Save-State
        }
        catch {
            Write-VMSLog "Main loop crash: $($_.Exception.ToString())" "ERROR"
        }

        Start-Sleep -Seconds 10
    }
}
finally {
    try {
        Flush-Queue
    }
    catch {}

    try {
        if ($mutex) {
            $mutex.ReleaseMutex()
            $mutex.Dispose()
        }
    }
    catch {}
}