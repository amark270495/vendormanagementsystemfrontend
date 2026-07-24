// src/components/DownloadAgentButton.jsx
import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Spinner from './Spinner';

const DownloadAgentButton = ({ userEmail, assetId }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();

            // 1. Generate the personalized .env file dynamically
            const envContent = `VMS_AGENT_VERSION=5.1.3
VMS_ASSET_ID=${assetId}
VMS_USER_EMAIL=${userEmail}
VMS_API_URL=https://vms-dashboard.in/api/logAssetSession
VMS_API_KEY=lNR68xdwGVY9O8SqQrjVRpCYvqd8w1uK2QuwMkU4YWQeAzFu0JonZg==`;
            zip.file(".env", envContent);

            // 2. Generate an idiot-proof double-clickable Setup.bat file
            const batContent = `@echo off
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
`;
            zip.file("Setup.bat", batContent);

            // 3. Generate a quick Instructions README
            const readmeContent = `TAPROOT SOLUTIONS - VMS TRACKER INSTALLATION
=============================================
Asset ID: ${assetId}
Assigned: ${userEmail}

INSTRUCTIONS:
1. Extract this entire ZIP file to a folder (e.g., your Desktop or Downloads).
2. Right-click the "Setup.bat" file.
3. Select "Run as Administrator".
4. A blue/black window will appear and copy the files to C:\\Tracking automatically.
5. You are done! The system will track in the background.`;
            zip.file("README_INSTRUCTIONS.txt", readmeContent);

            // 4. Fetch all 13 Scripts and XML Files
            const filesToFetch = [
                "Install.ps1",
                "VMS_Common.psm1",
                "VMS_Recovery.ps1",
                "VMS_Telemetry.ps1",
                "VMS_Tracker.ps1",
                "VMS_Watchdog.ps1",
                "VMS_Recovery.xml",
                "VMS_Telemetry.xml",
                "VMS_Tracker_Lock.xml",
                "VMS_Tracker_Login.xml",
                "VMS_Tracker_Logout.xml",
                "VMS_Tracker_Unlock.xml",
                "VMS_Watchdog.xml"
            ];

            for (const fileName of filesToFetch) {
                const response = await fetch(`/agent-scripts/${fileName}`);
                if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
                const fileText = await response.text();
                zip.file(fileName, fileText);
            }

            // 5. Generate the ZIP file
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `VMS_Agent_${assetId}.zip`);

        } catch (error) {
            console.error("Error generating agent zip:", error);
            alert("Failed to download the agent. Please contact IT Support.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={(e) => { e.preventDefault(); handleDownload(); }}
            disabled={!assetId || !userEmail || isDownloading}
            className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-xs font-semibold rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                !assetId || isDownloading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
            {isDownloading ? (
                <div className="flex items-center gap-2"><Spinner size="4" /> Bundling...</div>
            ) : (
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Tracking Agent
                </div>
            )}
        </button>
    );
};

export default DownloadAgentButton;