import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Icons ---
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-inherit mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const CpuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const getISTShiftDateString = () => {
    const browserNow = new Date();
    const utcTime = browserNow.getTime() + (browserNow.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (5.5 * 60 * 60 * 1000));
    if (istTime.getHours() < 12) istTime.setDate(istTime.getDate() - 1);
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatLogTime = (isoString) => {
    if (!isoString) return '-';
    try {
        const dateObj = new Date(isoString);
        return dateObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
};

const AssetManagementPage = () => {
    const { user } = useAuth();
    const { canManageAssets, canAssignAssets } = usePermissions();

    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeModal, setActiveModal] = useState(null); 
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [modalData, setModalData] = useState({});
    const [processing, setProcessing] = useState(false);

    const [modalTab, setModalTab] = useState('tracking'); 
    const [assetSessions, setAssetSessions] = useState([]);
    const [auditTrail, setAuditTrail] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [sessionDate, setSessionDate] = useState(getISTShiftDateString());
    const [logLimit, setLogLimit] = useState(100);
    const [workingTime, setWorkingTime] = useState('0h 0m');

    const [showLiveDashboard, setShowLiveDashboard] = useState(true);
    const [machineStats, setMachineStats] = useState({ active: 0, idle: 0, offline: 0 });
    const [systemAlerts, setSystemAlerts] = useState([]);
    const [weeklyUtilizationData, setWeeklyUtilizationData] = useState([]);

    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [importFile, setImportFile] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assetRes, userRes, statsRes] = await Promise.all([
                apiService.getAssets(user.userIdentifier),
                apiService.getUsers(user.userIdentifier),
                apiService.getFleetUtilizationStats(user.userIdentifier) 
            ]);
            
            setAssets(assetRes.data || []);
            setUsers(userRes.data?.users || []);
            setWeeklyUtilizationData(statsRes.data || []); 
            setError('');
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError('Failed to load asset data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [user.userIdentifier]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        let active = 0, idle = 0, offline = 0;
        const now = new Date();
        const alerts = [];

        assets.forEach(asset => {
            if (!asset.LastHeartbeat) {
                offline++;
            } else {
                const diffMinutes = (now - new Date(asset.LastHeartbeat)) / 60000;
                if (diffMinutes < 10) active++;
                else if (diffMinutes < 30) idle++;
                else offline++;

                if (diffMinutes > (30 * 24 * 60)) {
                    alerts.push({ 
                        asset: asset, type: 'danger', 
                        issue: 'Offline > 30 Days', targetTab: 'tracking' 
                    });
                }
            }

            if (asset.AssetStatus === 'Repair' && asset.LastStatusChange) {
                const repairDays = (now - new Date(asset.LastStatusChange)) / (1000 * 60 * 60 * 24);
                if (repairDays > 14) {
                    alerts.push({ 
                        asset: asset, type: 'warning', 
                        issue: `In Repair (${Math.floor(repairDays)}d)`, targetTab: 'audit' 
                    });
                }
            }

            if (asset.CriticalUpdatesCount > 0) {
                 alerts.push({ 
                     asset: asset, type: 'danger', 
                     issue: `${asset.CriticalUpdatesCount} Critical Updates Pending`, targetTab: 'telemetry' 
                 });
            }

            if (asset.AVEnabled === false || String(asset.AVEnabled).toLowerCase() === 'false' || 
                asset.RealTimeProtection === false || String(asset.RealTimeProtection).toLowerCase() === 'false') {
                 alerts.push({ 
                     asset: asset, type: 'danger', 
                     issue: 'Windows Defender Disabled', targetTab: 'telemetry' 
                 });
            }
        });

        setMachineStats({ active, idle, offline });
        setSystemAlerts(alerts);
    }, [assets]);

    const brandDistributionData = useMemo(() => {
        const counts = {};
        assets.forEach(a => { counts[a.AssetBrandName || 'Unknown'] = (counts[a.AssetBrandName || 'Unknown'] || 0) + 1; });
        return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    }, [assets]);

    const filteredAssets = useMemo(() => {
        let data = [...assets];
        if (statusFilter !== 'All') data = data.filter(a => a.AssetStatus === statusFilter);
        if (generalFilter) {
            const lower = generalFilter.toLowerCase();
            data = data.filter(a => 
                String(a.rowKey || '').toLowerCase().includes(lower) ||
                String(a.AssetBrandName || '').toLowerCase().includes(lower) ||
                String(a.AssetAssignedTo || '').toLowerCase().includes(lower)
            );
        }
        return data;
    }, [assets, statusFilter, generalFilter]);

    useEffect(() => { setCurrentPage(1); }, [statusFilter, generalFilter]);
    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;
    const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const openModal = (type, asset) => {
        setSelectedAsset(asset);
        setModalData({});
        setModalTab('tracking');
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedAsset(null);
        setModalData({});
        setImportFile(null);
        setAssetSessions([]);
        setAuditTrail([]);
        setLogLimit(100);
        setSessionDate(getISTShiftDateString());
    };

    const handleAlertClick = (asset, targetTab) => {
        viewAssetData(asset);
        setModalTab(targetTab);
    };

    const exportToCSV = () => {
        const headers = ['Asset ID', 'Brand', 'Model', 'Status', 'Assigned To', 'Last Heartbeat', 'CPU Usage %', 'RAM Usage %', 'Pending Updates'];
        const rows = filteredAssets.map(a => [
            a.rowKey, a.AssetBrandName, a.AssetModelName, a.AssetStatus, 
            a.AssetAssignedTo || 'Unassigned', a.LastHeartbeat || 'Unknown',
            a.CPUUsagePercent || 0, a.MemoryUsagePercent || 0, a.PendingUpdatesCount || 0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fleet_export_${getISTShiftDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return alert("Please select a CSV file.");
        setProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile[0]); 
            
            const response = await apiService.bulkImportAssets(formData, user.userIdentifier);
            alert(response.data?.message || "Import completed.");
            
            await fetchData();
            closeModal();
        } catch (err) { 
            alert(`Import failed: ${err.message || 'Server error'}`); 
        } finally { 
            setProcessing(false); 
        }
    };

    const viewAssetData = async (asset, selectedDate = sessionDate) => {
        const latestAssetData = assets.find(a => a.rowKey === asset.rowKey) || asset;
        setSelectedAsset(latestAssetData);
        setActiveModal('viewer');
        setLoadingSessions(true);
        try {
            const response = await apiService.getAssetSessions(latestAssetData.rowKey, selectedDate, user.userIdentifier);
            if (response.data && response.data.success) {
                setAssetSessions(response.data.sessions || []);
                setWorkingTime(response.data.formattedWorkingTime || '0h 0m');
            }
            
            const auditResponse = await apiService.getAssetAuditTrail(latestAssetData.rowKey, user.userIdentifier);
            if(auditResponse.data && auditResponse.data.success) {
                setAuditTrail(auditResponse.data.data || []);
            }

        } catch (err) { 
            console.error("Error loading asset data", err); 
            setAuditTrail([]);
        } finally { 
            setLoadingSessions(false); 
        }
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSessionDate(newDate);
        if (selectedAsset) viewAssetData(selectedAsset, newDate);
    };

    const handlePrintQRCode = () => {
        if (!selectedAsset) return;
        const qrScanData = `Asset ID: ${selectedAsset.rowKey}\nModel: ${selectedAsset.AssetBrandName || ''} ${selectedAsset.AssetModelName || ''}\nAssigned To: ${selectedAsset.AssetAssignedTo || 'Unassigned'}\nService Tag: ${selectedAsset.AssetServiceTag || 'N/A'}`;
        const encodedData = encodeURIComponent(qrScanData);

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Asset Label - ${selectedAsset.rowKey}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: flex-start; }
                        .label-container { display: flex; align-items: center; width: max-content; }
                        .qr-section { padding-right: 15px; }
                        .qr-section img { width: 110px; height: 110px; display: block; }
                        .details-table { border-collapse: collapse; }
                        .details-table th, .details-table td { border: 1px solid #000; padding: 6px 12px; font-size: 14px; text-align: left; }
                        .details-table th { font-weight: normal; }
                        @media print { @page { margin: 1cm; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        <div class="qr-section"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}" alt="QR Code" /></div>
                        <table class="details-table">
                            <tr><th>Asset Id</th><td>${selectedAsset.rowKey || ''}</td></tr>
                            <tr><th>Asset Brand & Model</th><td>${selectedAsset.AssetBrandName || ''} ${selectedAsset.AssetModelName || ''}</td></tr>
                            <tr><th>Asset Assigned To</th><td>${selectedAsset.AssetAssignedTo || ''}</td></tr>
                            <tr><th>Asset Service Tag</th><td>${selectedAsset.AssetServiceTag || ''}</td></tr>
                        </table>
                    </div>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (activeModal === 'assign') {
                const targetUser = users.find(u => u.username === modalData.userEmail);
                await apiService.assignAsset({ assetId: selectedAsset.rowKey, assignedToEmail: targetUser.username, assignedToName: targetUser.displayName }, user.userIdentifier);
            } else if (activeModal === 'reassign') {
                const targetUser = users.find(u => u.username === modalData.userEmail);
                await apiService.reassignAsset({ assetId: selectedAsset.rowKey, newAssignedToEmail: targetUser.username, newAssignedToName: targetUser.displayName }, user.userIdentifier);
            } else if (activeModal === 'service') {
                await apiService.serviceRepairAsset({ assetId: selectedAsset.rowKey, serviceDetails: modalData.details, isRepair: modalData.isRepair === 'true' }, user.userIdentifier);
            }
            await fetchData();
            closeModal();
        } catch (err) { alert(`Action failed: ${err.message}`); }
        finally { setProcessing(false); }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm(`Are you sure you want to delete asset ${assetId}?`)) return;
        try {
            await apiService.deleteAsset(assetId, user.userIdentifier);
            setAssets(assets.filter(a => a.rowKey !== assetId));
        } catch (err) { alert('Delete failed.'); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-green-100/80 text-green-800 border-green-200',
            'Assigned': 'bg-blue-100/80 text-blue-800 border-blue-200',
            'Service': 'bg-yellow-100/80 text-yellow-800 border-yellow-200',
            'Repair': 'bg-red-100/80 text-red-800 border-red-200'
        };
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>{status}</span>;
    };

    // --- CRITICAL FIX 1: Add Strict Null Checking to Badge Renderer ---
    const getEventBadge = (action) => {
        if (!action) return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-gray-100 text-gray-700 border border-gray-200">SYSTEM</span>;
        
        const actionLower = String(action).toLowerCase();
        if (['login', 'unlock', 'resume', 'active', 'wake', 'heartbeat'].includes(actionLower)) return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">{action}</span>;
        if (['logout', 'logoff', 'lock', 'sleep', 'hibernate', 'shutdown', 'offlineshutdown'].includes(actionLower)) return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-slate-200 text-slate-700 border border-slate-300">{action}</span>;
        return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-gray-100 text-gray-700 border border-gray-200">{action}</span>;
    };

    const getParsedUpdates = (jsonString) => {
        if (!jsonString) return [];
        try { return JSON.parse(jsonString); } catch(e) { return []; }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center"><LaptopIcon /> Hardware Assets</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Manage inventory, monitor lifecycle, and track live telemetry.</p>
                </div>
            </div>

            {/* LIVE FLEET DASHBOARD & ANALYTICS */}
            <div className="border-b border-slate-200 bg-slate-50">
                <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center"><ActivityIcon /> Intelligence Hub</h3>
                    <button onClick={() => setShowLiveDashboard(!showLiveDashboard)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                        {showLiveDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
                    </button>
                </div>

                {showLiveDashboard && (
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
                        {/* KPI Cards & Alerts */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3"><span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span></div>
                                    <div className="text-xs font-bold text-emerald-700 mb-1">Active Now</div>
                                    <div className="text-2xl font-black text-emerald-900">{machineStats.active}</div>
                                </div>
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 shadow-sm">
                                    <div className="text-xs font-bold text-slate-600 mb-1">Offline</div>
                                    <div className="text-2xl font-black text-slate-800">{machineStats.offline}</div>
                                </div>
                            </div>

                            {/* Automated Alerts Box */}
                            <div className="bg-white border border-rose-200 rounded-xl shadow-sm p-4 h-48 overflow-y-auto">
                                <h4 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center">System Alerts</h4>
                                {systemAlerts.length === 0 ? (
                                    <p className="text-sm text-slate-500 font-medium">No critical alerts detected.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {systemAlerts.map((alert, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={() => handleAlertClick(alert.asset, alert.targetTab)}
                                                className={`w-full text-left p-2.5 rounded-lg text-xs flex flex-col gap-1 border transition-all hover:shadow-md cursor-pointer ${
                                                    alert.type === 'danger' 
                                                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800' 
                                                        : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start w-full">
                                                    <div className="flex items-center font-black tracking-wide">
                                                        <AlertIcon /> {alert.asset.rowKey}
                                                    </div>
                                                    <span className="font-bold underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100">View Issue</span>
                                                </div>
                                                <div className="flex justify-between w-full font-medium mt-1">
                                                    <span className="truncate max-w-[50%]">{alert.asset.AssetAssignedTo || 'Unassigned'}</span>
                                                    <span className={`font-bold px-1.5 py-0.5 rounded shadow-sm ${alert.type === 'danger' ? 'bg-rose-200/50' : 'bg-amber-200/50'}`}>
                                                        {alert.issue}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visual Analytics */}
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-72">
                                <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Fleet Utilization (Last 7 Days)</h4>
                                {weeklyUtilizationData.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-slate-400 font-medium">No utilization data available</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="90%" minHeight={200} minWidth={0}>
                                        <BarChart data={weeklyUtilizationData}>
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                                            <YAxis stroke="#94a3b8" fontSize={10} />
                                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                            <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}}/>
                                            <Bar dataKey="active" name="Active Hours" stackId="a" fill="#10b981" />
                                            <Bar dataKey="idle" name="Idle Hours" stackId="a" fill="#f59e0b" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-72 flex flex-col">
                                <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Brand Distribution</h4>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                                        <PieChart>
                                            <Pie data={brandDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {brandDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                            <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FILTER & EXPORT/IMPORT BAR */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full sm:w-48 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-shadow">
                        <option value="All">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Service">Service</option>
                        <option value="Repair">Repair</option>
                    </select>

                    <div className="relative group w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
                        <input type="text" placeholder="Search by ID, brand, or user..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-shadow" />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={exportToCSV} className="inline-flex items-center px-4 py-2.5 border border-slate-300 shadow-sm text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                        <DownloadIcon /> Export CSV
                    </button>
                    {canManageAssets && (
                        <button onClick={() => openModal('import')} className="inline-flex items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                            <UploadIcon /> Import Assets
                        </button>
                    )}
                </div>
            </div>

            {/* ASSET TABLE */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Asset Information</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Status & Assignment</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Health & Sec</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium animate-pulse">Loading assets...</td></tr>
                        ) : paginatedAssets.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium">No assets match your search criteria.</td></tr>
                        ) : (
                            paginatedAssets.map((asset) => (
                                <tr key={asset.rowKey} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 shadow-sm"><LaptopIcon /></div>
                                            <div className="ml-3">
                                                <div className="text-sm font-extrabold text-slate-900">{asset.rowKey}</div>
                                                <div className="text-xs font-medium text-slate-500">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${asset.AgentVersion && asset.AgentVersion.startsWith('5') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    Agent: v{asset.AgentVersion || 'Legacy'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col items-start gap-1.5">
                                            {getStatusBadge(asset.AssetStatus)}
                                            <div className="text-xs text-slate-600 font-medium">{asset.AssetAssignedTo ? `Assigned: ${asset.AssetAssignedTo}` : <span className="italic text-slate-400">Unassigned</span>}</div>
                                        </div>
                                    </td>
                                    
                                    {/* Health & Security Summary Column */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1 text-xs font-medium">
                                            <div className="flex items-center gap-1">
                                                <span className={`h-2 w-2 rounded-full ${asset.AVEnabled === false || String(asset.AVEnabled).toLowerCase() === 'false' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                                <span className="text-slate-600">Defender: {asset.AVEnabled === false || String(asset.AVEnabled).toLowerCase() === 'false' ? 'Off' : 'Active'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`h-2 w-2 rounded-full ${asset.CriticalUpdatesCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                                <span className={asset.CriticalUpdatesCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                                    Updates: {asset.CriticalUpdatesCount > 0 ? `${asset.CriticalUpdatesCount} Critical` : 'Up to date'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                                        <button onClick={() => handleAlertClick(asset, 'tracking')} className="inline-flex items-center px-3 py-1.5 border border-indigo-100 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:shadow-sm transition-all">
                                            View Asset
                                        </button>
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                            {canAssignAssets && asset.AssetStatus === 'Available' && (<button onClick={() => openModal('assign', asset)} className="text-indigo-600 border border-indigo-100 bg-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors text-xs font-bold">Assign</button>)}
                                            {canAssignAssets && asset.AssetStatus === 'Assigned' && (<button onClick={() => openModal('reassign', asset)} className="text-indigo-600 border border-indigo-100 bg-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors text-xs font-bold">Reassign</button>)}
                                            {canManageAssets && (
                                                <>
                                                    <button onClick={() => openModal('service', asset)} className="text-amber-600 border border-amber-100 bg-white px-2.5 py-1.5 rounded-lg hover:bg-amber-50 shadow-sm transition-colors text-xs font-bold">Service</button>
                                                    <button onClick={() => handleDelete(asset.rowKey)} className="text-red-600 border border-red-100 bg-white px-2.5 py-1.5 rounded-lg hover:bg-red-50 shadow-sm transition-colors text-xs font-bold">Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {!loading && filteredAssets.length > 0 && (
                <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                            <p className="text-sm text-slate-700">Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of <span className="font-medium">{filteredAssets.length}</span> assets</p>
                            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="ml-2 block w-20 pl-3 pr-8 py-1.5 text-sm border-slate-300 focus:outline-none focus:ring-indigo-500 rounded-md">
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"><span className="sr-only">Previous</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg></button>
                            <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"><span className="sr-only">Next</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg></button>
                        </nav>
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col border border-slate-200 overflow-hidden transform transition-all ${activeModal === 'viewer' ? 'max-w-5xl max-h-[90vh]' : 'max-w-md'}`}>
                        
                        {/* MULTI-TAB ASSET VIEWER */}
                        {activeModal === 'viewer' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-800 flex items-center"><LaptopIcon /> Asset File: {selectedAsset.rowKey}</h3>
                                    </div>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-1.5 border border-slate-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50">
                                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                                        <button onClick={() => setModalTab('tracking')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${modalTab === 'tracking' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Live Session Tracking</button>
                                        <button onClick={() => setModalTab('telemetry')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-bold text-sm transition-colors flex items-center gap-1.5 ${modalTab === 'telemetry' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><CpuIcon/> Device Telemetry</button>
                                        <button onClick={() => setModalTab('audit')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${modalTab === 'audit' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Lifecycle Audit Trail</button>
                                        <button onClick={() => setModalTab('qrcode')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${modalTab === 'qrcode' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Asset QR Code</button>
                                    </nav>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                    
                                    {/* TAB 1: TRACKING */}
                                    {modalTab === 'tracking' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <input type="date" value={sessionDate} onChange={handleDateChange} className="px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                <div className="text-sm text-slate-600 font-bold">Total Logged: <strong className="text-lg font-black text-indigo-600 ml-1.5">{workingTime}</strong></div>
                                            </div>
                                            
                                            {loadingSessions && assetSessions.length === 0 ? (
                                                <div className="py-16 text-center text-slate-500 font-medium animate-pulse">Loading tracking data...</div>
                                            ) : (
                                                <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
                                                    <table className="min-w-full divide-y divide-slate-200">
                                                        <thead className="bg-slate-50">
                                                            <tr>
                                                                <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">Event</th>
                                                                <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">Time (IST)</th>
                                                                <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">Details</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-sm">
                                                            {assetSessions.slice(0, logLimit).map((session, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-5 py-3.5">{getEventBadge(session.actionType)}</td>
                                                                    <td className="px-5 py-3.5 text-indigo-600 font-bold">{formatLogTime(session.eventTimestamp)}</td>
                                                                    <td className="px-5 py-3.5 text-slate-600 italic truncate max-w-xs" title={session.workDoneNotes}>{String(session.workDoneNotes || '-')}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: DEVICE TELEMETRY */}
                                    {modalTab === 'telemetry' && (
                                        <div className="space-y-6">
                                            {/* System Resources */}
                                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                <h4 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-3"><CpuIcon /> System Resources & Health</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                                                <span>CPU Utilization</span>
                                                                <span>{selectedAsset.CPUUsagePercent || 0}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${selectedAsset.CPUUsagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${selectedAsset.CPUUsagePercent || 0}%` }}></div></div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                                                <span>Memory (RAM)</span>
                                                                <span>{selectedAsset.MemoryUsagePercent || 0}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${selectedAsset.MemoryUsagePercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${selectedAsset.MemoryUsagePercent || 0}%` }}></div></div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                            <div className="text-xs font-bold text-slate-500">Storage (C:)</div>
                                                            <div className="text-lg font-black text-slate-800 mt-1">{selectedAsset.DiskFreeGB || 0} <span className="text-sm text-slate-500 font-medium">GB Free</span></div>
                                                            <div className="text-[10px] text-slate-400 font-medium mt-1">of {selectedAsset.DiskTotalGB || 0} GB Total</div>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                            <div className="text-xs font-bold text-slate-500">System Uptime</div>
                                                            <div className="text-lg font-black text-slate-800 mt-1">{selectedAsset.UptimeHours || 0} <span className="text-sm text-slate-500 font-medium">Hours</span></div>
                                                            <div className="text-[10px] text-slate-400 font-medium mt-1">OS: {selectedAsset.OSVersion || 'Unknown'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Security Status */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                    <h4 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-3"><ShieldIcon /> Windows Defender</h4>
                                                    <ul className="space-y-3">
                                                        <li className="flex justify-between items-center text-sm">
                                                            <span className="font-bold text-slate-600">Antivirus Status</span>
                                                            {selectedAsset.AVEnabled === false || String(selectedAsset.AVEnabled).toLowerCase() === 'false' ? <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded">Disabled</span> : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded">Active</span>}
                                                        </li>
                                                        <li className="flex justify-between items-center text-sm">
                                                            <span className="font-bold text-slate-600">Real-Time Protection</span>
                                                            <span className="font-medium text-slate-800">{selectedAsset.RealTimeProtection === false || String(selectedAsset.RealTimeProtection).toLowerCase() === 'false' ? 'Disabled' : 'Enabled'}</span>
                                                        </li>
                                                        <li className="flex justify-between items-center text-sm">
                                                            <span className="font-bold text-slate-600">Signature Age</span>
                                                            <span className="font-medium text-slate-800">{selectedAsset.AVSignatureAge || 0} Days</span>
                                                        </li>
                                                        <li className="flex justify-between items-center text-sm">
                                                            <span className="font-bold text-slate-600">Engine Version</span>
                                                            <span className="font-medium text-slate-800">{selectedAsset.AVEngineVersion || 'Unknown'}</span>
                                                        </li>
                                                    </ul>
                                                </div>

                                                {/* Windows Updates */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                                    <h4 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-3">
                                                        <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                        Software Updates
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className={`p-3 rounded-lg border ${selectedAsset.PendingUpdatesCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                                            <div className="text-xs font-bold text-slate-500 mb-1">Total Pending</div>
                                                            <div className="text-2xl font-black text-slate-800">{selectedAsset.PendingUpdatesCount || 0}</div>
                                                        </div>
                                                        <div className={`p-3 rounded-lg border ${selectedAsset.CriticalUpdatesCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                                            <div className="text-xs font-bold text-slate-500 mb-1">Critical/Security</div>
                                                            <div className="text-2xl font-black text-rose-600">{selectedAsset.CriticalUpdatesCount || 0}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-2 overflow-y-auto max-h-32">
                                                        {getParsedUpdates(selectedAsset.PendingUpdatesList).length === 0 ? (
                                                            <div className="text-xs text-center text-slate-500 font-medium py-4">System is up to date or data unavailable.</div>
                                                        ) : (
                                                            <ul className="space-y-1.5">
                                                                {getParsedUpdates(selectedAsset.PendingUpdatesList).map((update, idx) => (
                                                                    <li key={idx} className="text-[11px] bg-white p-2 border border-slate-200 rounded shadow-sm flex items-start gap-2">
                                                                        {update.severity === 'Critical' ? <span className="h-2 w-2 mt-1 rounded-full bg-rose-500 flex-shrink-0"></span> : <span className="h-2 w-2 mt-1 rounded-full bg-amber-400 flex-shrink-0"></span>}
                                                                        <div>
                                                                            <span className="font-bold text-slate-700">{update.kb ? `KB${update.kb}: ` : ''}</span>
                                                                            <span className="text-slate-600">{update.title}</span>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: AUDIT TRAIL */}
                                    {modalTab === 'audit' && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h4 className="text-sm font-black uppercase text-slate-400 mb-6">Hardware Lifecycle Events</h4>
                                            
                                            {auditTrail.length === 0 ? (
                                                <div className="text-sm text-slate-500 font-medium text-center py-6">No historical audit events found for this asset.</div>
                                            ) : (
                                                <div className="relative border-l-2 border-indigo-200 ml-3 space-y-8">
                                                    {auditTrail.map((log, idx) => (
                                                        <div key={idx} className="relative pl-6">
                                                            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></div>
                                                            <p className="text-xs font-bold text-slate-500">{log.date || log.timestamp}</p>
                                                            <h5 className="text-sm font-extrabold text-slate-800 mt-1">{log.event || log.action}</h5>
                                                            <p className="text-xs text-slate-600 mt-0.5">Handled by: {log.user || log.agent}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 4: QR CODE */}
                                    {modalTab === 'qrcode' && (
                                        <div className="flex flex-col items-center justify-center py-10">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedAsset.rowKey}`} alt={`QR Code for ${selectedAsset.rowKey}`} className="mb-4" />
                                                <div className="text-center font-extrabold text-xl tracking-wider text-slate-800">{selectedAsset.rowKey}</div>
                                                <div className="text-center text-sm font-medium text-slate-500">{selectedAsset.AssetBrandName} {selectedAsset.AssetModelName}</div>
                                            </div>
                                            <button onClick={handlePrintQRCode} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700">Print QR Code</button>
                                        </div>
                                    )}

                                </div>
                            </div>
                        ) : activeModal === 'import' ? (
                            /* --- IMPORT MODAL --- */
                            <form onSubmit={handleImportSubmit} className="flex flex-col h-full">
                                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center"><UploadIcon /> Bulk Import Assets</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-1">Upload a CSV file to add new inventory.</p>
                                </div>
                                <div className="p-6 bg-slate-50 flex-1">
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors">
                                        <UploadIcon className="h-10 w-10 text-slate-400 mb-3" />
                                        <p className="text-sm font-bold text-slate-700 mb-1">Drag and drop your CSV here</p>
                                        <p className="text-xs text-slate-500 mb-4">Must contain Asset ID, Brand, and Model</p>
                                        <input type="file" accept=".csv" required onChange={(e) => setImportFile(e.target.files)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl">{processing ? 'Uploading...' : 'Import Data'}</button>
                                </div>
                            </form>
                        ) : (
                            /* --- ACTION MODALS (Assign, Service) --- */
                            <form onSubmit={handleActionSubmit} className="flex flex-col h-full">
                                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center capitalize">{activeModal} Asset: <span className="text-indigo-600 ml-2">{selectedAsset.rowKey}</span></h3>
                                </div>
                                <div className="p-6 bg-slate-50 space-y-5 flex-1">
                                    {(activeModal === 'assign' || activeModal === 'reassign') && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Target Employee</label>
                                            <select required value={modalData.userEmail || ''} onChange={(e) => setModalData({...modalData, userEmail: e.target.value})} className="w-full border-slate-300 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700">
                                                <option value="" disabled>-- Choose Employee --</option>
                                                {users.map(u => <option key={u.username} value={u.username}>{u.displayName} ({u.username})</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {activeModal === 'service' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Service Type</label>
                                                <select required value={modalData.isRepair || ''} onChange={(e) => setModalData({...modalData, isRepair: e.target.value})} className="w-full border-slate-300 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700">
                                                    <option value="" disabled>-- Select Type --</option>
                                                    <option value="false">Routine Service / Maintenance</option>
                                                    <option value="true">Hardware Repair</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Service Details</label>
                                                <textarea required rows="4" value={modalData.details || ''} onChange={(e) => setModalData({...modalData, details: e.target.value})} className="w-full border-slate-300 rounded-xl p-3 shadow-sm resize-none"></textarea>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl">{processing ? 'Processing...' : `Confirm ${activeModal}`}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManagementPage;