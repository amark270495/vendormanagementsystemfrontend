import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- SVG Icons ---
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const CpuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

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
    
    // --- UI States ---
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [activeModal, setActiveModal] = useState(null); 
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [modalData, setModalData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [modalTab, setModalTab] = useState('tracking'); 

    // --- Bulk Operations ---
    const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());

    // --- Viewer Data ---
    const [assetSessions, setAssetSessions] = useState([]);
    const [auditTrail, setAuditTrail] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [sessionDate, setSessionDate] = useState(getISTShiftDateString());
    const [workingTime, setWorkingTime] = useState('0h 0m');

    // --- Dashboard Telemetry ---
    const [showLiveDashboard, setShowLiveDashboard] = useState(true);
    const [machineStats, setMachineStats] = useState({ active: 0, idle: 0, offline: 0 });
    const [systemAlerts, setSystemAlerts] = useState([]);
    const [weeklyUtilizationData, setWeeklyUtilizationData] = useState([]);

    // --- Main Pagination & Filters ---
    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [importFile, setImportFile] = useState(null);

    // --- Popup Pagination ---
    const [sessionPage, setSessionPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const popupItemsPerPage = 10;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assetRes, userRes, statsRes] = await Promise.all([
                apiService.getAssets(user.userIdentifier),
                apiService.getUsers(user.userIdentifier),
                apiService.getFleetUtilizationStats(user.userIdentifier).catch(() => ({ data: [] }))
            ]);
            setAssets(assetRes.data || []);
            setUsers(userRes.data?.users || []);
            setWeeklyUtilizationData(statsRes.data || []); 
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    }, [user.userIdentifier]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Data Aggregations
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
                    alerts.push({ asset, type: 'danger', issue: 'Offline > 30 Days', targetTab: 'tracking' });
                }
            }

            if (asset.AssetStatus === 'Repair' && asset.LastStatusChange) {
                const repairDays = (now - new Date(asset.LastStatusChange)) / (1000 * 60 * 60 * 24);
                if (repairDays > 14) {
                    alerts.push({ asset, type: 'warning', issue: `In Repair (${Math.floor(repairDays)}d)`, targetTab: 'audit' });
                }
            }

            if (asset.CriticalUpdatesCount > 0) {
                 alerts.push({ asset, type: 'danger', issue: `${asset.CriticalUpdatesCount} Critical Updates`, targetTab: 'telemetry' });
            }

            if (String(asset.AVEnabled).toLowerCase() === 'false' || String(asset.RealTimeProtection).toLowerCase() === 'false') {
                 alerts.push({ asset, type: 'danger', issue: 'Defender Disabled', targetTab: 'telemetry' });
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

    // Active Applications (Software Tab) derived from sessions
    const activeApplications = useMemo(() => {
        const apps = new Set();
        assetSessions.forEach(session => {
            if (String(session.actionType).toLowerCase() === 'activeapp' && session.workDoneNotes) {
                apps.add(session.workDoneNotes.split(' - ')); 
            }
        });
        return Array.from(apps);
    }, [assetSessions]);

    // Filtering Logic
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

    const paginatedSessions = assetSessions.slice((sessionPage - 1) * popupItemsPerPage, sessionPage * popupItemsPerPage);
    const totalSessionPages = Math.ceil(assetSessions.length / popupItemsPerPage) || 1;

    const paginatedAudit = auditTrail.slice((auditPage - 1) * popupItemsPerPage, auditPage * popupItemsPerPage);
    const totalAuditPages = Math.ceil(auditTrail.length / popupItemsPerPage) || 1;

    // --- Bulk Selection Handlers ---
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paginatedAssets.map(a => a.rowKey);
            setSelectedAssetIds(new Set([...selectedAssetIds, ...allIds]));
        } else {
            const currentIds = paginatedAssets.map(a => a.rowKey);
            const newSet = new Set(selectedAssetIds);
            currentIds.forEach(id => newSet.delete(id));
            setSelectedAssetIds(newSet);
        }
    };

    const toggleSelectAsset = (id) => {
        const newSet = new Set(selectedAssetIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedAssetIds(newSet);
    };

    const handleBulkAction = (action) => {
        if (selectedAssetIds.size === 0) return;
        if (action === 'delete') {
            if (window.confirm(`Are you sure you want to permanently delete ${selectedAssetIds.size} assets?`)) {
                alert(`Bulk delete triggered for ${selectedAssetIds.size} assets.`);
                setSelectedAssetIds(new Set());
            }
        } else {
            setModalData({ isBulk: true, assetIds: Array.from(selectedAssetIds) });
            setActiveModal(action);
        }
    };

    // --- Modal Controls ---
    const openModal = (type, asset = null) => {
        if (asset) setSelectedAsset(asset);
        setModalData({});
        setModalTab('tracking');
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedAsset(null);
        setImportFile(null);
        setAssetSessions([]);
        setAuditTrail([]);
        setSessionPage(1);
        setAuditPage(1);
        setSessionDate(getISTShiftDateString());
    };

    const handleAlertClick = (asset, targetTab) => {
        viewAssetData(asset);
        setModalTab(targetTab);
    };

    const viewAssetData = async (asset, selectedDate = sessionDate) => {
        const latestAssetData = assets.find(a => a.rowKey === asset.rowKey) || asset;
        setSelectedAsset(latestAssetData);
        setActiveModal('viewer');
        setLoadingSessions(true);
        setSessionPage(1);
        setAuditPage(1);

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
        } catch (err) { console.error("Error loading asset data", err); } 
        finally { setLoadingSessions(false); }
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSessionDate(newDate);
        if (selectedAsset) viewAssetData(selectedAsset, newDate);
    };

    // --- Action Handlers ---
    const handleActionSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (modalData.isBulk) {
                alert(`Executing bulk ${activeModal} on ${modalData.assetIds.length} assets.`);
                setSelectedAssetIds(new Set());
            } else {
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
            }
            closeModal();
        } catch (err) { alert(`Action failed: ${err.message}`); }
        finally { setProcessing(false); }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm(`Are you sure you want to permanently delete asset ${assetId}?`)) return;
        try {
            await apiService.deleteAsset(assetId, user.userIdentifier);
            setAssets(assets.filter(a => a.rowKey !== assetId));
            setSelectedAssetIds(prev => { const newSet = new Set(prev); newSet.delete(assetId); return newSet; });
        } catch (err) { alert('Delete failed.'); }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return alert("Please select a CSV file.");
        setProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile); 
            await apiService.bulkImportAssets(formData, user.userIdentifier);
            await fetchData();
            closeModal();
        } catch (err) { alert(`Import failed: ${err.message}`); } 
        finally { setProcessing(false); }
    };

    const exportToCSV = () => {
        const targetAssets = selectedAssetIds.size > 0 
            ? filteredAssets.filter(a => selectedAssetIds.has(a.rowKey))
            : filteredAssets;

        const headers = ['Asset ID', 'Brand', 'Model', 'Status', 'Assigned To', 'Last Heartbeat', 'CPU Usage %', 'RAM Usage %', 'Pending Updates'];
        const rows = targetAssets.map(a => [
            a.rowKey, a.AssetBrandName, a.AssetModelName, a.AssetStatus, 
            a.AssetAssignedTo || 'Unassigned', a.LastHeartbeat || 'Unknown',
            a.CPUUsagePercent || 0, a.MemoryUsagePercent || 0, a.PendingUpdatesCount || 0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `fleet_export_${getISTShiftDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintQRCode = () => {
        if (!selectedAsset) return;
        const qrScanData = `Asset ID: ${selectedAsset.rowKey}\nModel: ${selectedAsset.AssetBrandName || ''} ${selectedAsset.AssetModelName || ''}\nAssigned To: ${selectedAsset.AssetAssignedTo || 'Unassigned'}\nService Tag: ${selectedAsset.AssetServiceTag || 'N/A'}`;
        const encodedData = encodeURIComponent(qrScanData);

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${selectedAsset.rowKey}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 20px; display: flex; align-items: center; justify-content: center; } 
                        .card { border: 2px solid #000; padding: 20px; border-radius: 12px; text-align: center; width: 300px; }
                        .qr { width: 180px; height: 180px; margin-bottom: 15px; }
                        h2 { margin: 0 0 5px 0; font-size: 24px; }
                        p { margin: 0; font-size: 14px; color: #333; }
                        @media print { @page { margin: 0; } body { margin: 1cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}" alt="QR" />
                        <h2>${selectedAsset.rowKey}</h2>
                        <p>${selectedAsset.AssetBrandName} ${selectedAsset.AssetModelName}</p>
                    </div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- Formatters ---
    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Assigned': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'Service': 'bg-amber-50 text-amber-700 border-amber-200',
            'Repair': 'bg-rose-50 text-rose-700 border-rose-200'
        };
        return <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{status}</span>;
    };

    const getEventBadge = (action) => {
        if (!action) return <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-black text-slate-500 uppercase">SYSTEM</span>;
        const lower = String(action).toLowerCase();
        if (['login', 'active', 'resume', 'heartbeat'].includes(lower)) return <span className="text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-black text-emerald-600 uppercase">{action}</span>;
        if (['activeapp'].includes(lower)) return <span className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-black text-slate-600 uppercase">{action}</span>;
        if (['logout', 'lock', 'sleep', 'shutdown', 'idle'].includes(lower)) return <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-black text-slate-500 uppercase">{action}</span>;
        return <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-black text-slate-500 uppercase">{action}</span>;
    };

    const getParsedUpdates = (jsonString) => {
        if (!jsonString) return [];
        try { return JSON.parse(jsonString); } catch(e) { return []; }
    };

    const isAllPageSelected = paginatedAssets.length > 0 && paginatedAssets.every(a => selectedAssetIds.has(a.rowKey));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-slate-800 relative pb-16">
            
            {/* --- HEADER & TOP ACTIONS --- */}
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight"><LaptopIcon /> Enterprise Asset Management</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Telemetry monitoring, application auditing, and hardware lifecycle tracking.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={exportToCSV} className="inline-flex items-center justify-center w-full md:w-auto px-4 py-2 border border-slate-200 shadow-sm text-sm font-bold rounded-lg text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                        <DownloadIcon /> {selectedAssetIds.size > 0 ? `Export (${selectedAssetIds.size})` : 'Export All'}
                    </button>
                    {canManageAssets && (
                        <button onClick={() => openModal('import')} className="inline-flex items-center justify-center w-full md:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                            <UploadIcon /> Bulk Import
                        </button>
                    )}
                </div>
            </div>

            {/* --- LIVE DASHBOARD (INTELLIGENCE HUB) --- */}
            <div className="border-b border-slate-200 bg-slate-50/50">
                <div className="px-6 py-3 flex justify-between items-center border-b border-slate-200 bg-white">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center tracking-wide uppercase"><ActivityIcon /> Intelligence Hub</h3>
                    <button onClick={() => setShowLiveDashboard(!showLiveDashboard)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                        {showLiveDashboard ? 'Collapse Dashboard' : 'Expand Dashboard'}
                    </button>
                </div>

                {showLiveDashboard && (
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
                        
                        {/* Column 1: Counters & Alerts */}
                        <div className="flex flex-col gap-4 col-span-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3"><span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span></div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Now</div>
                                    <div className="text-3xl font-black text-emerald-600">{machineStats.active}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Offline</div>
                                    <div className="text-3xl font-black text-slate-700">{machineStats.offline}</div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[140px]">
                                <h4 className="text-[10px] font-black uppercase text-rose-400 mb-3 border-b border-slate-100 pb-2">System Alerts</h4>
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                                    {systemAlerts.length === 0 ? (
                                        <div className="text-xs text-slate-400 font-medium">All systems normal.</div>
                                    ) : (
                                        systemAlerts.map((alert, idx) => (
                                            <div key={idx} onClick={() => handleAlertClick(alert.asset, alert.targetTab)} className="group cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                                                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                                    <span className="flex items-center"><AlertIcon className="text-rose-500"/> {alert.asset.rowKey}</span>
                                                    <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">View &rarr;</span>
                                                </div>
                                                <div className="text-[10px] font-medium text-rose-600 mt-1">{alert.issue}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2 & 3: Utilization Chart */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-64 flex flex-col">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Fleet Utilization (Last 7 Days)</h4>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '12px'}} />
                                        <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}}/>
                                        <Bar dataKey="active" name="Active Hrs" stackId="a" fill="#10b981" radius={[4, 4]} />
                                        <Bar dataKey="idle" name="Idle Hrs" stackId="a" fill="#cbd5e1" radius={[4, 4]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Column 4: Brand Distribution Pie Chart */}
                        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-64 flex flex-col">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Brand Distribution</h4>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={brandDistributionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                                            {brandDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '12px'}} />
                                        <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* --- FILTER & VIEW BAR --- */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="All">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Service">Service</option>
                        <option value="Repair">Repair</option>
                    </select>
                    <div className="w-full md:w-80 relative">
                        <input type="text" placeholder="Search ID, brand, or user..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="w-full pl-3 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon/></button>
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><GridIcon/></button>
                </div>
            </div>

            {/* --- PRIMARY DATA VIEW --- */}
            <div className="bg-white min-h-[300px]">
                {loading ? (
                    <div className="py-12 text-center text-sm font-medium text-slate-400 animate-pulse">Syncing fleet data...</div>
                ) : paginatedAssets.length === 0 ? (
                    <div className="py-12 text-center text-sm font-medium text-slate-400">No assets match your search criteria.</div>
                ) : viewMode === 'list' ? (
                    /* LIST VIEW */
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left w-10">
                                        <input type="checkbox" checked={isAllPageSelected} onChange={toggleSelectAll} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black tracking-wider text-slate-500 uppercase">Hardware ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black tracking-wider text-slate-500 uppercase">Assignment & Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black tracking-wider text-slate-500 uppercase">Health Score</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black tracking-wider text-slate-500 uppercase">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedAssets.map((asset) => (
                                    <tr key={asset.rowKey} className={`transition-colors group ${selectedAssetIds.has(asset.rowKey) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}>
                                        <td className="px-6 py-4">
                                            <input type="checkbox" checked={selectedAssetIds.has(asset.rowKey)} onChange={() => toggleSelectAsset(asset.rowKey)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-extrabold text-slate-800 tracking-tight">{asset.rowKey}</div>
                                            <div className="text-xs text-slate-500 font-medium">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 items-start">
                                                {getStatusBadge(asset.AssetStatus)}
                                                <span className="text-[11px] text-slate-500 font-bold">{asset.AssetAssignedTo || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5 text-[11px] font-bold text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`h-2 w-2 rounded-full ${String(asset.AVEnabled).toLowerCase() === 'false' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                                    Defender {String(asset.AVEnabled).toLowerCase() === 'false' ? 'Off' : 'Active'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`h-2 w-2 rounded-full ${asset.CriticalUpdatesCount > 0 ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
                                                    {asset.CriticalUpdatesCount > 0 ? `${asset.CriticalUpdatesCount} Patches Pending` : 'Up to date'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => handleAlertClick(asset, 'tracking')} className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 transition-colors">View Details</button>
                                                
                                                {canAssignAssets && asset.AssetStatus === 'Available' && (<button onClick={() => openModal('assign', asset)} className="text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 shadow-sm transition-colors">Assign</button>)}
                                                {canAssignAssets && asset.AssetStatus === 'Assigned' && (<button onClick={() => openModal('reassign', asset)} className="text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 shadow-sm transition-colors">Reassign</button>)}
                                                
                                                {canManageAssets && (
                                                    <>
                                                        <button onClick={() => openModal('service', asset)} className="text-xs font-bold text-amber-700 hover:text-amber-900 border border-amber-200 px-3 py-1.5 rounded-md bg-amber-50 shadow-sm transition-colors">Service</button>
                                                        <button onClick={() => handleDelete(asset.rowKey)} className="text-xs font-bold text-rose-700 hover:text-rose-900 border border-rose-200 px-3 py-1.5 rounded-md bg-rose-50 shadow-sm transition-colors">Delete</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* GRID VIEW */
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedAssets.map((asset) => (
                            <div key={asset.rowKey} className={`relative p-5 rounded-2xl border transition-all ${selectedAssetIds.has(asset.rowKey) ? 'border-indigo-400 bg-indigo-50/30 shadow-md' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'}`}>
                                <div className="absolute top-4 left-4">
                                    <input type="checkbox" checked={selectedAssetIds.has(asset.rowKey)} onChange={() => toggleSelectAsset(asset.rowKey)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                </div>
                                <div className="text-center mt-2">
                                    <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl mx-auto flex items-center justify-center mb-3"><LaptopIcon className="mr-0" /></div>
                                    <div className="text-lg font-black text-slate-800">{asset.rowKey}</div>
                                    <div className="text-xs font-medium text-slate-500 mb-4">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                    <div className="mb-4">{getStatusBadge(asset.AssetStatus)}</div>
                                    <div className="text-[11px] font-bold text-slate-600 bg-slate-50 py-1.5 rounded-md">{asset.AssetAssignedTo || 'Unassigned'}</div>
                                </div>
                                <div className="mt-5 border-t border-slate-100 pt-4 flex justify-between gap-2">
                                    <button onClick={() => handleAlertClick(asset, 'tracking')} className="flex-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 py-2 rounded border border-indigo-100">Details</button>
                                    {canManageAssets && <button onClick={() => openModal('service', asset)} className="flex-1 text-[11px] font-bold text-amber-700 bg-amber-50 py-2 rounded border border-amber-100">Service</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- FLOATING BULK ACTION BAR --- */}
            {selectedAssetIds.size > 0 && (
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-fadeIn z-40 border border-slate-700">
                    <span className="font-black text-xs bg-indigo-500 px-3 py-1.5 rounded-lg">{selectedAssetIds.size} Selected</span>
                    {canAssignAssets && <button onClick={() => handleBulkAction('assign')} className="text-xs font-bold hover:text-indigo-400 transition-colors">Bulk Assign</button>}
                    {canManageAssets && <button onClick={() => handleBulkAction('service')} className="text-xs font-bold hover:text-amber-400 transition-colors">Bulk Service</button>}
                    {canManageAssets && <button onClick={() => handleBulkAction('delete')} className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors">Delete Selected</button>}
                    <button onClick={() => setSelectedAssetIds(new Set())} className="ml-4 text-slate-400 hover:text-white">&times;</button>
                </div>
            )}

            {/* --- MAIN TABLE PAGINATION --- */}
            {!loading && filteredAssets.length > 0 && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of <span className="font-bold text-slate-800">{filteredAssets.length}</span> records</p>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-300 shadow-sm bg-white text-xs font-bold text-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors">Previous</button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-300 shadow-sm bg-white text-xs font-bold text-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors">Next</button>
                    </div>
                </div>
            )}

            {/* --- POPUP MODALS --- */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col border border-slate-200 overflow-hidden transform transition-all ${activeModal === 'viewer' ? 'max-w-4xl max-h-[90vh]' : 'max-w-md'}`}>
                        
                        {/* --- ASSET VIEWER MODAL (TABS) --- */}
                        {activeModal === 'viewer' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center z-10 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-slate-800 flex items-center tracking-tight"><LaptopIcon /> {selectedAsset.rowKey} </h3>
                                        <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{selectedAsset.AssetAssignedTo || 'Unassigned'}</span>
                                        {/* Lifecycle Indicator */}
                                        {selectedAsset.UptimeHours > 168 && <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">Reboot Needed</span>}
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button onClick={closeModal} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-full p-1 border border-slate-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                    </div>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 overflow-x-auto">
                                    <button onClick={() => setModalTab('tracking')} className={`pb-3 px-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${modalTab === 'tracking' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Session Tracking</button>
                                    <button onClick={() => setModalTab('telemetry')} className={`pb-3 px-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${modalTab === 'telemetry' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Device Telemetry</button>
                                    <button onClick={() => setModalTab('software')} className={`pb-3 px-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${modalTab === 'software' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Active Software</button>
                                    <button onClick={() => setModalTab('audit')} className={`pb-3 px-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${modalTab === 'audit' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Audit Trail</button>
                                    <button onClick={() => setModalTab('qrcode')} className={`pb-3 px-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${modalTab === 'qrcode' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>QR Code Label</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 bg-white">
                                    
                                    {/* TAB 1: SESSION TRACKING */}
                                    {modalTab === 'tracking' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <input type="date" value={sessionDate} onChange={handleDateChange} className="px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                                                <div className="text-xs text-slate-500 font-bold tracking-wider uppercase">Active Shift Time: <span className="text-lg font-black text-indigo-600 ml-1.5">{workingTime}</span></div>
                                            </div>
                                            
                                            {loadingSessions ? (
                                                <div className="py-16 text-center text-sm font-medium text-slate-400 animate-pulse">Loading telemetry logs...</div>
                                            ) : (
                                                <div className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                                                    <table className="min-w-full divide-y divide-slate-200">
                                                        <thead className="bg-slate-50">
                                                            <tr>
                                                                <th className="px-5 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Event Trigger</th>
                                                                <th className="px-5 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Timestamp (IST)</th>
                                                                <th className="px-5 py-3 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">System Notes</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {paginatedSessions.length === 0 ? (
                                                                <tr><td colSpan="3" className="px-5 py-8 text-center text-sm font-medium text-slate-400">No session data recorded for this date.</td></tr>
                                                            ) : (
                                                                paginatedSessions.map((session, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                                        <td className="px-5 py-3">{getEventBadge(session.actionType)}</td>
                                                                        <td className="px-5 py-3 text-xs font-bold text-slate-700">{formatLogTime(session.eventTimestamp)}</td>
                                                                        <td className="px-5 py-3 text-xs font-medium text-slate-500 truncate max-w-[250px] italic">{session.workDoneNotes || '-'}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                    
                                                    {assetSessions.length > 0 && (
                                                        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center">
                                                            <span className="text-xs font-medium text-slate-500">Total: <strong className="text-slate-700">{assetSessions.length}</strong> events</span>
                                                            <div className="flex gap-1.5 items-center">
                                                                <button onClick={() => setSessionPage(p => Math.max(1, p - 1))} disabled={sessionPage === 1} className="px-3 py-1.5 bg-white border border-slate-300 rounded shadow-sm text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors">Prev</button>
                                                                <span className="text-xs font-bold text-slate-600 px-2">{sessionPage} / {totalSessionPages}</span>
                                                                <button onClick={() => setSessionPage(p => Math.min(totalSessionPages, p + 1))} disabled={sessionPage === totalSessionPages} className="px-3 py-1.5 bg-white border border-slate-300 rounded shadow-sm text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors">Next</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: DEVICE TELEMETRY */}
                                    {modalTab === 'telemetry' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* System Specs */}
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center border-b border-slate-200 pb-2"><CpuIcon/> Hardware Resources</h4>
                                                <div>
                                                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5"><span>CPU Utilization</span><span className="text-indigo-700">{selectedAsset.CPUUsagePercent || 0}%</span></div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2"><div className={`h-2 rounded-full ${selectedAsset.CPUUsagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${selectedAsset.CPUUsagePercent || 0}%`}}></div></div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5"><span>Memory (RAM)</span><span className="text-indigo-700">{selectedAsset.MemoryUsagePercent || 0}%</span></div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2"><div className={`h-2 rounded-full ${selectedAsset.MemoryUsagePercent > 85 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{width: `${selectedAsset.MemoryUsagePercent || 0}%`}}></div></div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                                                        <div className="text-[10px] font-bold uppercase text-slate-400">Free Storage</div>
                                                        <div className="text-lg font-black text-slate-800">{selectedAsset.DiskFreeGB || 0} <span className="text-xs text-slate-500 font-medium">GB</span></div>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                                                        <div className="text-[10px] font-bold uppercase text-slate-400">System Uptime</div>
                                                        <div className="text-lg font-black text-slate-800">{selectedAsset.UptimeHours || 0} <span className="text-xs text-slate-500 font-medium">Hrs</span></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Security Center */}
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center border-b border-slate-200 pb-2 mb-4"><ShieldIcon/> Security & Updates</h4>
                                                
                                                <div className="flex justify-between items-center mb-4 bg-white p-3 border border-slate-200 rounded-lg">
                                                    <span className="text-xs font-bold text-slate-600">Windows Defender</span>
                                                    {String(selectedAsset.AVEnabled).toLowerCase() === 'false' ? <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] uppercase rounded">Disabled</span> : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase rounded">Active</span>}
                                                </div>

                                                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                    <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                                        <span className="text-[10px] font-bold uppercase text-slate-500">Pending Patches</span>
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${selectedAsset.CriticalUpdatesCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>{selectedAsset.PendingUpdatesCount || 0} Total</span>
                                                    </div>
                                                    <div className="p-2 flex-1 overflow-y-auto max-h-32">
                                                        {getParsedUpdates(selectedAsset.PendingUpdatesList).length === 0 ? (
                                                            <div className="text-xs text-center text-slate-400 font-medium py-4">System is fully patched.</div>
                                                        ) : (
                                                            <ul className="space-y-1.5">
                                                                {getParsedUpdates(selectedAsset.PendingUpdatesList).map((update, idx) => (
                                                                    <li key={idx} className="text-[10px] bg-slate-50 p-2 border border-slate-100 rounded flex items-start gap-2">
                                                                        {update.severity === 'Critical' ? <span className="h-1.5 w-1.5 mt-1 rounded-full bg-rose-500 flex-shrink-0"></span> : <span className="h-1.5 w-1.5 mt-1 rounded-full bg-amber-400 flex-shrink-0"></span>}
                                                                        <div className="font-medium text-slate-600"><strong className="text-slate-800">{update.kb ? `KB${update.kb}: ` : ''}</strong>{update.title}</div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: SOFTWARE AUDIT */}
                                    {modalTab === 'software' && (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Active Software Auditing</h4>
                                            <p className="text-xs text-slate-500 mb-6 font-medium">Unique applications parsed from PowerShell <code className="bg-slate-200 px-1 rounded">ActiveApp</code> telemetry for the selected date.</p>
                                            
                                            <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden overflow-y-auto p-2">
                                                {activeApplications.length === 0 ? (
                                                    <div className="text-sm font-medium text-slate-400 text-center py-8">No active software detected for this session date.</div>
                                                ) : (
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {activeApplications.map((app, idx) => (
                                                            <li key={idx} className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-center gap-3">
                                                                <span className="h-2 w-2 rounded-full bg-indigo-400"></span> {app}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 4: AUDIT TRAIL */}
                                    {modalTab === 'audit' && (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">Hardware Lifecycle Events</h4>
                                            <div className="space-y-6 relative border-l-2 border-indigo-200 ml-3">
                                                {paginatedAudit.length === 0 ? (
                                                    <div className="text-sm font-medium text-slate-400 pl-4 py-2 text-center border-none">No historical records found.</div>
                                                ) : (
                                                    paginatedAudit.map((log, idx) => (
                                                        <div key={idx} className="pl-6 relative">
                                                            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></div>
                                                            <div className="text-[10px] font-bold text-slate-500">{log.date || log.timestamp}</div>
                                                            <div className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5">{log.event}</div>
                                                            <div className="text-[11px] text-slate-600 font-medium mt-1">Performed by <span className="text-indigo-600">{log.user}</span></div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            
                                            {auditTrail.length > 0 && (
                                                <div className="mt-8 border-t border-slate-200 pt-4 flex justify-between items-center">
                                                    <span className="text-xs font-medium text-slate-500">Total records: <strong className="text-slate-700">{auditTrail.length}</strong></span>
                                                    <div className="flex gap-1.5 items-center">
                                                        <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1} className="px-3 py-1.5 bg-white border border-slate-300 shadow-sm rounded text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors">Prev</button>
                                                        <span className="text-xs font-bold text-slate-600 px-2">{auditPage} / {totalAuditPages}</span>
                                                        <button onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))} disabled={auditPage === totalAuditPages} className="px-3 py-1.5 bg-white border border-slate-300 shadow-sm rounded text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors">Next</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 5: QR CODE LABEL */}
                                    {modalTab === 'qrcode' && (
                                        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center w-80">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`Asset ID: ${selectedAsset.rowKey}\nModel: ${selectedAsset.AssetBrandName || ''} ${selectedAsset.AssetModelName || ''}\nAssigned To: ${selectedAsset.AssetAssignedTo || 'Unassigned'}\nService Tag: ${selectedAsset.AssetServiceTag || 'N/A'}`)}`} alt={`QR Code for ${selectedAsset.rowKey}`} className="mx-auto mb-6 w-48 h-48" />
                                                <div className="font-black text-2xl tracking-wider text-slate-900 mb-1">{selectedAsset.rowKey}</div>
                                                <div className="text-sm font-medium text-slate-500 mb-3">{selectedAsset.AssetBrandName} {selectedAsset.AssetModelName}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-3 mt-3">{selectedAsset.AssetServiceTag || 'N/A'}</div>
                                            </div>
                                            <button onClick={handlePrintQRCode} className="mt-8 px-8 py-3 bg-indigo-600 text-white font-black tracking-wide uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-colors hover:shadow-lg focus:ring-4 focus:ring-indigo-200">Print Asset Label</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeModal === 'import' ? (
                            /* --- IMPORT MODAL --- */
                            <form onSubmit={handleImportSubmit} className="flex flex-col h-full">
                                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center tracking-tight"><UploadIcon /> Bulk Import Data</h3>
                                </div>
                                <div className="p-6 bg-slate-50">
                                    <p className="text-xs text-slate-500 mb-4 font-medium">Upload a CSV containing standard asset headers (Asset ID, Brand, Model).</p>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 bg-white flex flex-col items-center justify-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/30">
                                        <input type="file" accept=".csv" required onChange={(e) => setImportFile(e.target.files)} className="text-sm font-medium text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700 transition-colors">{processing ? 'Uploading Data...' : 'Import CSV'}</button>
                                </div>
                            </form>
                        ) : (
                            /* --- ACTION MODALS (Assign, Reassign, Service) --- */
                            <form onSubmit={handleActionSubmit} className="flex flex-col h-full">
                                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight capitalize">
                                        {modalData.isBulk ? `Bulk ${activeModal}` : `${activeModal} Asset:`} 
                                        {!modalData.isBulk && <span className="text-indigo-600 ml-1">{selectedAsset?.rowKey}</span>}
                                    </h3>
                                </div>
                                <div className="p-6 bg-slate-50 space-y-4">
                                    {(activeModal === 'assign' || activeModal === 'reassign') && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Employee</label>
                                            <select required value={modalData.userEmail || ''} onChange={(e) => setModalData({...modalData, userEmail: e.target.value})} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="" disabled>-- Select Employee --</option>
                                                {users.map(u => <option key={u.username} value={u.username}>{u.displayName} ({u.username})</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {activeModal === 'service' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Service Type</label>
                                                <select required value={modalData.isRepair || ''} onChange={(e) => setModalData({...modalData, isRepair: e.target.value})} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                    <option value="" disabled>-- Select Type --</option>
                                                    <option value="false">Routine Maintenance / Checkup</option>
                                                    <option value="true">Hardware Repair Required</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Service Details</label>
                                                <textarea required rows="4" placeholder="Enter notes..." value={modalData.details || ''} onChange={(e) => setModalData({...modalData, details: e.target.value})} className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"></textarea>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700 transition-colors">{processing ? 'Processing...' : 'Confirm Execution'}</button>
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