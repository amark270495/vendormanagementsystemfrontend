// src/components/DownloadAgentButton.jsx
import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DownloadAgentButton = ({ userEmail, assetId }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();

            // 1. Generate the personalized .env file dynamically
            // (Ensure this string is flush left so no spaces break the .env format)
            const envContent = `VMS_AGENT_VERSION=5.1.3
VMS_ASSET_ID=${assetId}
VMS_USER_EMAIL=${userEmail}
VMS_API_URL=https://vms-dashboard.in/api/logAssetSession
VMS_API_KEY=lNR68xdwGVY9O8SqQrjVRpCYvqd8w1uK2QuwMkU4YWQeAzFu0JonZg==`;

            zip.file(".env", envContent);

            // 2. Define the static files to fetch from your public/agent-scripts/ folder
            const filesToFetch = [
                "Install.ps1",
                "VMS_Common.psm1",
                "VMS_Recovery.ps1",
                "VMS_Telemetry.ps1",
                "VMS_Tracker.ps1",
                "VMS_Watchdog.ps1"
            ];

            // 3. Fetch each file and add it to the ZIP archive
            for (const fileName of filesToFetch) {
                const response = await fetch(`/agent-scripts/${fileName}`);
                if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
                const fileText = await response.text();
                zip.file(fileName, fileText);
            }

            // 4. Generate the ZIP file and trigger the browser download
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `VMS_Tracking_Agent_${assetId}.zip`);

        } catch (error) {
            console.error("Error generating agent zip:", error);
            alert("Failed to download the agent. Please contact IT Support.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={!assetId || !userEmail || isDownloading}
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                !assetId || isDownloading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
        >
            {/* Download Icon */}
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isDownloading ? "Bundling Agent..." : "Download Tracking Agent"}
        </button>
    );
};

export default DownloadAgentButton;