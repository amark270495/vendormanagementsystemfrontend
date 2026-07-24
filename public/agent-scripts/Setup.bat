@echo off
echo =======================================================
echo Taproot Solutions - VMS Tracker Setup
echo =======================================================
echo.
NET SESSION >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator privileges confirmed. Installing...
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0Install.ps1"
) else (
    color 4F
    echo ERROR: YOU MUST RUN THIS AS ADMINISTRATOR!
    echo Please right-click this Setup.bat file and select "Run as Administrator".
    echo.
    pause
)