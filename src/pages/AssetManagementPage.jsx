import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// --- Icons ---
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

// --- SHIFT DATE DETECTOR ---
const getISTShiftDateString = () => {
    const browserNow = new Date();
    const utcTime = browserNow.getTime() + (browserNow.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (5.5 * 60 * 60 * 1000));
    
    if (istTime.getHours() < 12) {
        istTime.setDate(istTime.getDate() - 1);
    }
    
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

    // --- CORE STATES ---
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- MODAL & ACTION STATES ---
    const [activeModal, setActiveModal] = useState(null); 
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [modalData, setModalData] = useState({});
    const [processing, setProcessing] = useState(false);

    // --- SESSION TRACKING STATES ---
    const [assetSessions, setAssetSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [sessionDate, setSessionDate] = useState(getISTShiftDateString());
    const [activeTab, setActiveTab] = useState('all');
    
    // Log Pagination
    const [logLimit, setLogLimit] = useState(100);
    const [workingTime, setWorkingTime] = useState('0h 0m');

    // Dashboard States
    const [showLiveDashboard, setShowLiveDashboard] = useState(true);
    const [machineStats, setMachineStats] = useState({ active: 0, idle: 0, offline: 0 });

    // 🚀 NEW: Table Filtering & Pagination States
    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assetRes, userRes] = await Promise.all([
                apiService.getAssets(user.userIdentifier),
                apiService.getUsers(user.userIdentifier)
            ]);
            setAssets(assetRes.data || []);
            setUsers(userRes.data?.users || []);
            setError('');
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError('Failed to load asset data.');
        } finally {
            setLoading(false);
        }
    }, [user.userIdentifier]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Live Fleet Dashboard Calculation
    useEffect(() => {
        let active = 0, idle = 0, offline = 0;
        const now = new Date();

        assets.forEach(asset => {
            if (!asset.LastHeartbeat) {
                offline++;
                return;
            }
            
            const diffMinutes = (now - new Date(asset.LastHeartbeat)) / 60000;
            if (diffMinutes < 10) active++;
            else if (diffMinutes < 30) idle++;
            else offline++;
        });

        setMachineStats({ active, idle, offline });
    }, [assets]);

    // 🚀 NEW: Filter and Paginate Assets
    const filteredAssets = useMemo(() => {
        let data = [...assets];

        if (statusFilter !== 'All') {
            data = data.filter(a => a.AssetStatus === statusFilter);
        }

        if (generalFilter) {
            const lower = generalFilter.toLowerCase();
            data = data.filter(a => 
                String(a.rowKey || '').toLowerCase().includes(lower) ||
                String(a.AssetBrandName || '').toLowerCase().includes(lower) ||
                String(a.AssetModelName || '').toLowerCase().includes(lower) ||
                String(a.AssetAssignedTo || '').toLowerCase().includes(lower)
            );
        }
        return data;
    }, [assets, statusFilter, generalFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, generalFilter]);

    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;
    const paginatedAssets = filteredAssets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const openModal = (type, asset) => {
        setSelectedAsset(asset);
        setModalData({});
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedAsset(null);
        setModalData({});
        setAssetSessions([]);
        setActiveTab('all');
        setLogLimit(100);
        setSessionDate(getISTShiftDateString());
    };

    // --- FETCH SESSIONS ---
    const viewAssetSessions = async (asset, selectedDate = sessionDate) => {
        setSelectedAsset(asset);
        setActiveModal('sessions');
        setLoadingSessions(true);
        try {
            const response = await apiService.getAssetSessions(asset.rowKey, selectedDate, user.userIdentifier);
            if (response.data && response.data.success) {
                setAssetSessions(response.data.sessions || []);
                setWorkingTime(response.data.formattedWorkingTime || '0h 0m');
            }
        } catch (err) {
            console.error("Error loading asset sessions", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    // 30-Second Auto Refresh for Open Modal
    useEffect(() => {
        if (activeModal !== 'sessions' || !selectedAsset) return;
        
        const interval = setInterval(() => {
            viewAssetSessions(selectedAsset, sessionDate);
        }, 30000); 

        return () => clearInterval(interval);
    }, [activeModal, selectedAsset, sessionDate]);

    // Modal Header Activity Status
    const activityStatus = useMemo(() => {
        if (!assetSessions.length) return null;
        const latest = assetSessions; 
        const diffMinutes = (new Date() - new Date(latest.eventTimestamp)) / 60000;

        if (diffMinutes < 10) return { label: "User Active", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
        if (diffMinutes < 30) return { label: "Recently Active", color: "bg-amber-100 text-amber-800 border-amber-200" };
        return { label: "Offline", color: "bg-slate-200 text-slate-700 border-slate-300" };
    }, [assetSessions]);

    // --- FORM ACTIONS ---
    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSessionDate(newDate);
        if (selectedAsset) viewAssetSessions(selectedAsset, newDate);
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

    // --- UI HELPERS ---
    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-green-100/80 text-green-800 border-green-200',
            'Assigned': 'bg-blue-100/80 text-blue-800 border-blue-200',
            'Service': 'bg-yellow-100/80 text-yellow-800 border-yellow-200',
            'Repair': 'bg-red-100/80 text-red-800 border-red-200'
        };
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>{status}</span>;
    };

    const getEventBadge = (action, category, notes) => {
        const actionLower = action.toLowerCase();
        const catLower = (category || '').toLowerCase();
        const noteLower = (notes || '').toLowerCase();

        if (noteLower.includes('previous shutdown detected')) return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-rose-100 text-rose-800 border border-rose-200" title="Triggered by PowerShell on boot">Offline Shutdwn</span>;
        if (actionLower === 'agentcrash') return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-red-100 text-red-800 border border-red-300 shadow-sm" title="Agent auto-recovered">Crash Detected</span>;
        if (actionLower === 'restartaccepted') return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-blue-100 text-blue-800 border border-blue-200">Restarted</span>;
        if (actionLower === 'shiftendenforced') return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-violet-100 text-violet-800 border border-violet-200">Shift Ended</span>;
        if (['login', 'unlock', 'resume', 'active', 'wake', 'heartbeat'].includes(actionLower)) return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">{action}</span>;
        if (['logout', 'logoff', 'lock', 'sleep', 'hibernate', 'shutdown'].includes(actionLower)) return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-slate-200 text-slate-700 border border-slate-300">{action}</span>;
        if (catLower === 'idle' || actionLower === 'idle') return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-200">{action}</span>;
        if (catLower === 'usage' || actionLower.includes('usage')) return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">{action}</span>;
        
        return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-gray-100 text-gray-700 border border-gray-200">{action}</span>;
    };

    const filteredSessions = assetSessions.filter(s => {
        const cat = (s.eventCategory || '').toLowerCase();
        const act = s.actionType.toLowerCase();
        if (activeTab === 'all') return true;
        if (activeTab === 'attendance') return cat === 'session' || ['login', 'logoff', 'logout', 'lock', 'unlock', 'resume', 'wake', 'heartbeat', 'restartaccepted', 'shiftendenforced'].includes(act);
        if (activeTab === 'idle') return cat === 'idle' || act === 'idle';
        if (activeTab === 'usage') return cat === 'usage' || act.includes('usage');
        return true;
    });

    const visibleSessions = filteredSessions.slice(0, logLimit);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* --- HEADER --- */}
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center"><LaptopIcon /> Hardware Assets</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Manage inventory, assignments, and active shift tracking.</p>
                </div>
            </div>

            {/* LIVE FLEET DASHBOARD */}
            <div className="p-6 border-b border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <ActivityIcon /> Live Fleet Status
                    </h3>
                    <button onClick={() => setShowLiveDashboard(!showLiveDashboard)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                        {showLiveDashboard ? 'Hide Dashboard' : 'Show Live Dashboard'}
                    </button>
                </div>

                {showLiveDashboard && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-sm font-bold text-slate-500 mb-1">Total Assigned</div>
                            <div className="text-2xl font-black text-slate-800">{assets.filter(a => a.AssetStatus === 'Assigned').length}</div>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>
                            <div className="text-sm font-bold text-emerald-700 mb-1">Currently Active</div>
                            <div className="text-2xl font-black text-emerald-900">{machineStats.active}</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                            <div className="text-sm font-bold text-amber-700 mb-1">Idle {'>'} 10m</div>
                            <div className="text-2xl font-black text-amber-900">{machineStats.idle}</div>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 shadow-sm">
                            <div className="text-sm font-bold text-slate-600 mb-1">Offline / Unknown</div>
                            <div className="text-2xl font-black text-slate-800">{machineStats.offline}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🚀 NEW: FILTER & SEARCH BAR */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full sm:w-48 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Service">Service</option>
                        <option value="Repair">Repair</option>
                    </select>

                    <div className="relative group w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search by ID, brand, or user..." 
                            value={generalFilter} 
                            onChange={(e) => setGeneralFilter(e.target.value)} 
                            className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow" 
                        />
                    </div>
                </div>

                <button onClick={fetchData} disabled={loading} className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    <svg className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh List
                </button>
            </div>

            {error && <div className="m-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium">{error}</div>}

            {/* --- ASSET TABLE --- */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Asset Information</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Status & Assignment</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Tracking Logs</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Actions</th>
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
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 shadow-sm"><LaptopIcon /></div>
                                            <div className="ml-4">
                                                <div className="text-sm font-extrabold text-slate-900">{asset.rowKey}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-col items-start gap-2">
                                            {getStatusBadge(asset.AssetStatus)}
                                            <div className="text-xs text-slate-600 font-medium">{asset.AssetAssignedTo ? `Assigned: ${asset.AssetAssignedTo}` : <span className="italic text-slate-400">Unassigned</span>}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <button onClick={() => viewAssetSessions(asset)} className="inline-flex items-center px-4 py-2 border border-indigo-100 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:shadow-sm transition-all">
                                            <ActivityIcon /> View Logs
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canAssignAssets && asset.AssetStatus === 'Available' && (<button onClick={() => openModal('assign', asset)} className="text-indigo-600 border border-indigo-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors">Assign</button>)}
                                            {canAssignAssets && asset.AssetStatus === 'Assigned' && (<button onClick={() => openModal('reassign', asset)} className="text-indigo-600 border border-indigo-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors">Reassign</button>)}
                                            {canManageAssets && (
                                                <>
                                                    <button onClick={() => openModal('service', asset)} className="text-amber-600 border border-amber-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-amber-50 shadow-sm transition-colors">Service</button>
                                                    <button onClick={() => handleDelete(asset.rowKey)} className="text-red-600 border border-red-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-red-50 shadow-sm transition-colors">Delete</button>
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

            {/* 🚀 NEW: PAGINATION CONTROLS */}
            {!loading && filteredAssets.length > 0 && (
                <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                            <p className="text-sm text-slate-700">
                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of <span className="font-medium">{filteredAssets.length}</span> assets
                            </p>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="ml-2 block w-20 pl-3 pr-8 py-1.5 text-sm border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col border border-slate-200 overflow-hidden transform transition-all ${activeModal === 'sessions' ? 'max-w-5xl max-h-[90vh]' : 'max-w-md'}`}>
                        
                        {/* --- SESSIONS MODAL --- */}
                        {activeModal === 'sessions' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-slate-800 flex items-center"><ActivityIcon /> Tracking Logs: {selectedAsset.rowKey}</h3>
                                            <p className="text-sm font-medium text-slate-500 mt-1">Live Feed & Shift Tracking</p>
                                        </div>
                                        {activityStatus && (
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${activityStatus.color}`}>
                                                {activityStatus.label}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-1.5 border border-slate-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                </div>

                                <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                                    <div className="flex items-center space-x-3">
                                        <label className="text-sm font-bold text-slate-600">Shift Date:</label>
                                        <input type="date" value={sessionDate} onChange={handleDateChange} className="px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-bold text-indigo-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl">
                                            <ClockIcon />
                                            <span className="text-sm text-slate-600 font-bold ml-1 tracking-wide">
                                                Total Logged Time: <strong className="text-lg font-black text-indigo-600 ml-1.5">{workingTime}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 pt-3 border-b border-slate-200 bg-white">
                                    <nav className="-mb-px flex space-x-8">
                                        {['all', 'attendance', 'idle', 'usage'].map((tab) => (
                                            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-bold text-sm tracking-wide transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}>
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)} Events
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                    {loadingSessions && assetSessions.length === 0 ? (
                                        <div className="py-16 text-center text-slate-500 font-medium animate-pulse">Loading tracking data...</div>
                                    ) : visibleSessions.length === 0 ? (
                                        <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300">
                                            <ActivityIcon />
                                            <p className="text-slate-500 font-medium mt-3">No activity records found for this shift.</p>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase w-32">Event</th>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">User Email</th>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">Time (IST)</th>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">Details / Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm">
                                                    {visibleSessions.map((session, idx) => (
                                                        <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                                                            <td className="px-5 py-3.5">{getEventBadge(session.actionType, session.eventCategory, session.workDoneNotes)}</td>
                                                            <td className="px-5 py-3.5 text-slate-700 font-bold">{session.userEmail}</td>
                                                            <td className="px-5 py-3.5 text-indigo-600 font-bold tracking-wide whitespace-nowrap">{formatLogTime(session.eventTimestamp)}</td>
                                                            <td className="px-5 py-3.5 text-slate-600 italic font-medium">{session.workDoneNotes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {filteredSessions.length > logLimit && (
                                        <div className="mt-6 text-center">
                                            <button 
                                                onClick={() => setLogLimit(prev => prev + 100)} 
                                                className="px-5 py-2.5 text-sm font-bold bg-white border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 shadow-sm transition-colors"
                                            >
                                                Load More Logs ({filteredSessions.length - logLimit} remaining)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* --- ACTION MODALS --- */
                            <form onSubmit={handleActionSubmit} className="flex flex-col h-full">
                                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center capitalize">
                                        {activeModal === 'assign' || activeModal === 'reassign' ? <UsersIcon /> : <ActivityIcon />}
                                        {activeModal} Asset: <span className="text-indigo-600 ml-2">{selectedAsset.rowKey}</span>
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{selectedAsset.AssetBrandName} {selectedAsset.AssetModelName}</p>
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
                                                <textarea required rows="4" value={modalData.details || ''} onChange={(e) => setModalData({...modalData, details: e.target.value})} className="w-full border-slate-300 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none" placeholder="Describe the issue or service performed..."></textarea>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center min-w-[120px]">{processing ? 'Processing...' : `Confirm ${activeModal}`}</button>
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